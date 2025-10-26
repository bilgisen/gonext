import { getStore } from "@netlify/blobs";
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  try {
    const store = getStore({
      name: "news-images",
      consistency: "strong"
    });

    const blob = await store.get(key, {
      type: "stream"
    });

    if (!blob) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get metadata for content type
    const metadata = await store.getMetadata(key);

    return new NextResponse(blob, {
      headers: {
        'Content-Type': metadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('Error retrieving blob:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
