import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }
  
  try {
    const store = getStore({ 
      name: "news-images", 
      consistency: "strong",
      siteID: process.env.NETLIFY_SITE_ID
    });
    
    // Try to get the blob from Netlify Blobs
    const blob = await store.get(key, { type: 'blob' });
    
    if (!blob) {
      // If not found in Blobs, try to fetch from the original URL as fallback
      const response = await fetch(`https://${process.env.NETLIFY_BLOB_STORE_URL}/${key}`);
      
      if (!response.ok) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
      }
      
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      return new NextResponse(Buffer.from(imageBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }
    
    // If found in Blobs, serve it
    const arrayBuffer = await blob.arrayBuffer();
    
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': blob.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
