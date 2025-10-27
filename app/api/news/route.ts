import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { CATEGORY_MAPPINGS } from '@/types/news';

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

    console.log('📡 API Request:', { filters, url: request.url });

    // Build WHERE conditions
    let whereConditions = ['status = \'published\''];

    if (filters.category) {
      // Map URL parameter to actual category name using CATEGORY_MAPPINGS
      const mappedCategory = CATEGORY_MAPPINGS[filters.category.toLowerCase()] || filters.category;

      console.log('🔍 Looking for category:', mappedCategory);

      // First check if category exists
      const categoryCheck = await (db as any).execute(`
        SELECT id FROM categories WHERE name = '${mappedCategory.replace(/'/g, "''")}'
      `);

      if (categoryCheck.rows.length > 0) {
        const categoryId = categoryCheck.rows[0].id;
        whereConditions.push(`
          EXISTS (
            SELECT 1 FROM news_categories
            WHERE news_categories.news_id = news.id
            AND news_categories.category_id = ${categoryId}
          )
        `);
      } else {
        console.warn('⚠️ Category not found:', mappedCategory);
        // Return empty result if category doesn't exist
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 20,
            has_more: false,
          },
        });
      }
    }

    if (filters.tag) {
      const tagResult = await (db as any).execute(`
        SELECT id FROM tags WHERE name = '${filters.tag.replace(/'/g, "''")}'
      `);

      if (tagResult.rows.length > 0) {
        const tagId = tagResult.rows[0].id;
        whereConditions.push(`
          EXISTS (
            SELECT 1 FROM news_tags
            WHERE news_tags.news_id = news.id
            AND news_tags.tag_id = ${tagId}
          )
        `);
      }
    }

    // Search in title, content, or seo fields
    if (filters.search) {
      whereConditions.push(`
        (
          title ILIKE '%${filters.search}%' OR
          seo_title ILIKE '%${filters.search}%' OR
          seo_description ILIKE '%${filters.search}%' OR
          content_md ILIKE '%${filters.search}%'
        )
      `);
    }

    const whereClause = whereConditions.join(' AND ');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    console.log('🔍 Final WHERE clause:', whereClause);

    // Get total count
    const countResult = await (db as any).execute(`
      SELECT COUNT(*) as count FROM news WHERE ${whereClause}
    `);

    const total = parseInt(countResult.rows[0].count);
    console.log('🔍 Count result:', total);

    // Get news items
    const newsResult = await (db as any).execute(`
      SELECT
        id, source_guid, source_id, title, seo_title, seo_description,
        excerpt, content_md, slug, canonical_url, status, visibility,
        word_count, reading_time_min, published_at, created_at, updated_at,
        main_media_id
      FROM news
      WHERE ${whereClause}
      ORDER BY published_at DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    console.log('🔍 News query result:', newsResult.rows.length, 'items');

    // Transform to NewsItem format
    const items = await Promise.all(
      newsResult.rows.map(async (row: any) => {
        // Get categories for this news item
        const catsResult = await (db as any).execute(`
          SELECT c.name FROM categories c
          INNER JOIN news_categories nc ON c.id = nc.category_id
          WHERE nc.news_id = ${row.id}
        `);

        // Get tags for this news item
        const tagsResult = await (db as any).execute(`
          SELECT t.name FROM tags t
          INNER JOIN news_tags nt ON t.id = nt.tag_id
          WHERE nt.news_id = ${row.id}
        `);

        // Get main image if exists
        let image = '';
        let imageTitle = '';
        if (row.main_media_id) {
          const mediaResult = await (db as any).execute(`
            SELECT external_url, storage_path, alt_text, caption
            FROM media WHERE id = ${row.main_media_id}
          `);

          if (mediaResult.rows.length > 0) {
            const media = mediaResult.rows[0];
            image = media.external_url || media.storage_path || '';
            imageTitle = media.alt_text || media.caption || '';
          }
        }

        return {
          id: row.id.toString(),
          source_guid: row.source_guid,
          source_id: row.source_id,
          seo_title: row.seo_title || row.title,
          seo_description: row.seo_description || row.excerpt || '',
          tldr: [],
          content_md: row.content_md || '',
          category: catsResult.rows.length > 0 ? catsResult.rows[0].name : 'General',
          tags: tagsResult.rows.map((tag: any) => tag.name),
          image: image,
          image_title: imageTitle,
          image_desc: '',
          original_url: row.canonical_url || '',
          file_path: '',
          created_at: row.created_at?.toISOString() || '',
          published_at: row.published_at?.toISOString() || row.created_at?.toISOString() || '',
          updated_at: row.updated_at?.toISOString() || '',
          slug: row.slug,
          read_time: row.reading_time_min || undefined,
          is_bookmarked: false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        has_more: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('❌ News API route error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
