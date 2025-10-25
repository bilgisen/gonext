import { NextRequest, NextResponse } from 'next/server';
import { getNewsList } from '@/lib/api/externalApiClient';

// Internal API route for news data (runs on server, accesses database)
// This is NOT an external API - it's a Next.js internal route for server-client separation
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters = {
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await getNewsList(filters);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('News API route error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
