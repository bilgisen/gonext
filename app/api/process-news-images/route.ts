import { NextResponse } from 'next/server';
import { syncNewsImages } from '@/lib/news/image-sync';
import { NewsApiItem } from '@/lib/news/types';

// This API route can be called to process images for news items
export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { items: NewsApiItem[] }' },
        { status: 400 }
      );
    }

    // Process the images (this will upload them to our storage)
    const processedItems = await syncNewsImages(items as NewsApiItem[]);

    return NextResponse.json({ 
      success: true, 
      items: processedItems 
    });

  } catch (error) {
    console.error('Error processing news images:', error);
    return NextResponse.json(
      { error: 'Failed to process images', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// For testing the endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST /api/process-news-images with { items: NewsApiItem[] } to process news images' 
  });
}
