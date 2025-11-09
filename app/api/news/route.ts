// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { databaseApiClient } from '@/lib/api/externalApiClient';

export const runtime = 'nodejs';

// Helper function to safely get a number from URLSearchParams
function getNumberParam(params: URLSearchParams, key: string, defaultValue: number): number {
  const value = params.get(key);
  return value ? Math.max(1, parseInt(value, 10)) : defaultValue;
}

// Helper to safely parse status
function parseStatus(status: string | null): 'draft' | 'published' | 'archived' {
  if (status === 'draft' || status === 'published' || status === 'archived') {
    return status;
  }
  return 'published'; // Default to published
}

// Helper to split and trim comma-separated values
function splitAndTrim(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  console.log('🔍 News API Request URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    // Get offset first to avoid declaration order issues
    const offset = searchParams.get('offset');
    const page = getNumberParam(searchParams, 'page', 1);
    const limit = Math.min(getNumberParam(searchParams, 'limit', 10), 100);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const status = parseStatus(searchParams.get('status'));
    const sortBy = searchParams.get('sortBy') || 'published_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const featured = searchParams.get('featured');
    const author = searchParams.get('author');
    const categories = splitAndTrim(searchParams.get('categories'));
    const tags = splitAndTrim(searchParams.get('tags'));

    console.log('📋 Request Parameters:', {
      ...(offset !== null ? { offset } : { page }),
      limit,
      category,
      tag,
      search,
      status,
      sortBy,
      sortOrder,
      featured,
      author,
      categories,
      tags
    });

    // Offset is already declared at the top
    
    // Build the filters object
    const filters: any = {
      limit,
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
      ...(search ? { search } : {}),
      status,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      ...(featured !== null ? { featured: featured === 'true' } : {}),
      ...(author ? { author } : {}),
      ...(categories.length > 0 ? { categories } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    };
    
    // Use either offset or page-based pagination
    if (offset !== null) {
      filters.offset = parseInt(offset, 10);
    } else {
      filters.page = page;
    }

    console.log('🔍 Database query filters:', JSON.stringify(filters, null, 2));

    // Use the database client to fetch news
    console.log('📡 Fetching news from database...');
    const result = await databaseApiClient.getNews(filters);
    
    console.log('✅ Database query result:', {
      itemCount: result?.items?.length || 0,
      total: result?.total,
      page: result?.page,
      limit: result?.limit,
      hasMore: result?.has_more
    });

    return NextResponse.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit),
        has_more: result.has_more,
      },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
