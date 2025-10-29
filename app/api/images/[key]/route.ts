import { NextResponse } from "next/server";
import { getNewsImageStore } from "@/lib/blob-utils";
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> } // Burayı değiştirin
) {
  try {
    // params nesnesini await ile çözün
    const { key } = await context.params;

    if (!key) {
      return NextResponse.json(
        { error: 'Image key is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to fetch blob with key:', key);

    // Get the image store
    const store = getNewsImageStore();
    
    if (!store) {
      console.error('Failed to initialize image store');
      return NextResponse.json(
        { error: 'Failed to initialize image store' },
        { status: 500 }
      );
    }

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