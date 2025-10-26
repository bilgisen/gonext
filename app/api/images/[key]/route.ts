import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Make the function async
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> } // Note: params is now a Promise
) {
  try {
    // Await the params Promise before destructuring
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: 'Image key is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to fetch blob with key:', key);

    // Simplify the store initialization
    const store = getStore({
      name: "news-images",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    // Get blob with metadata for debugging
    const result = await store.getWithMetadata(key, { type: "blob" });
    
    if (!result) {
      console.error('No data returned for key:', key);
      return NextResponse.json(
        { error: 'Image data not found' },
        { status: 404 }
      );
    }

    const { data: imageBlob, metadata } = result;

    if (!imageBlob) {
      console.error('Blob not found for key:', key);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log('Successfully retrieved blob with metadata:', metadata);

    // Convert blob to buffer
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type from metadata or file extension
    const contentType = metadata?.contentType || 
                      key.endsWith('.png') ? 'image/png' :
                      key.endsWith('.webp') ? 'image/webp' :
                       key.endsWith('.gif') ? 'image/gif' : 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Standard cache header
        'CDN-Cache-Control': 'public, max-age=31536000, immutable', // CDN-specific cache header
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        'Vary': 'Accept-Encoding' // Indicate that the response varies based on Accept-Encoding
      }
    });
  } catch (error) {
    console.error('Error in image route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}