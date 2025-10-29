// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client'; // Drizzle client'iniz
import {
  news,
  categories,
  tags,
  media,
  news_categories,
  news_tags,
} from '@/db/schema'; // Schema dosyanız
import { eq, and, or, ilike, inArray, desc, sql } from 'drizzle-orm';
import { CATEGORY_MAPPINGS, NewsItem, NewsListResponse } from '@/types/news'; // CATEGORY_MAPPINGS ve NewsItem/NewsListResponse import edin

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters = {
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1, // Varsayılan 1
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20, // Varsayılan 20
      search: searchParams.get('search') || undefined,
    };

    // Limitleri kontrol et
    filters.page = Math.max(1, filters.page);
    filters.limit = Math.min(50, Math.max(1, filters.limit)); // Max 50, Min 1
    const offset = (filters.page - 1) * filters.limit;

    console.log('📡 API Request:', { filters, url: request.url });

    // Initialize query conditions with the base filter
    const whereConditions = [eq(news.status, 'published')]; // Base filter
    const withQueries: any[] = []; // For CTE (WITH) clauses

    // Kategori filtresi
    if (filters.category) {
      const categoryNames = filters.category.split(',').map(cat => cat.trim().toLowerCase());
      console.log('🔍 Looking for categories:', categoryNames);

      // CATEGORY_MAPPINGS ile eşle
      const mappedCategoryNames = categoryNames.map(name => CATEGORY_MAPPINGS[name] || name);

      // Geçerli kategori ID'lerini veritabanından çek
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.name, mappedCategoryNames));

      if (categoryResult.length > 0) {
        const categoryIds = categoryResult.map(row => row.id);
        // Create a subquery for news with matching categories
        const newsInCategories = db.$with('news_in_categories').as(
          db.selectDistinct({ id: news.id })
            .from(news)
            .innerJoin(news_categories, eq(news.id, news_categories.news_id))
            .where(inArray(news_categories.category_id, categoryIds))
        );
        
        // Add the condition using the subquery
        whereConditions.push(
          inArray(news.id, db.select({ id: newsInCategories.id }).from(newsInCategories))
        );
        
        // Add the WITH clause to the main query
        withQueries.push(newsInCategories);
      } else {
        console.warn('⚠️ No valid categories found in:', mappedCategoryNames);
        // Geçerli kategori yoksa, boş sonuç döndür
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: filters.page,
            limit: filters.limit,
            has_more: false,
          },
        } as { success: boolean; data: NewsListResponse });
      }
    }

    // Etiket filtresi
    if (filters.tag) {
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, filters.tag));

      if (tagResult.length > 0) {
        const tagId = tagResult[0].id;
        // Create a subquery for news with the matching tag
        const newsWithTag = db.$with('news_with_tag').as(
          db.selectDistinct({ id: news.id })
            .from(news)
            .innerJoin(news_tags, eq(news.id, news_tags.news_id))
            .where(eq(news_tags.tag_id, tagId))
        );
        
        // Add the condition using the subquery
        whereConditions.push(
          inArray(news.id, db.select({ id: newsWithTag.id }).from(newsWithTag))
        );
        
        // Add the WITH clause to the main query
        withQueries.push(newsWithTag);
      }
    }

    // Search filter
    if (filters.search?.trim()) {
      const searchTerm = `%${filters.search}%`;
      const searchConditions = [
        ilike(news.title, searchTerm),
        ilike(news.seo_title, searchTerm),
        ilike(news.seo_description, searchTerm),
        ilike(news.content_md, searchTerm)
      ].filter(Boolean);
      
      if (searchConditions.length > 0) {
        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          whereConditions.push(searchCondition);
        }
      }
    }

    // Create base where conditions for count (without CTE references)
    const countWhereConditions = [
      eq(news.status, 'published')
    ];

    // Add category filter if needed
    if (filters.category) {
      const categoryNames = filters.category.split(',').map(cat => cat.trim().toLowerCase());
      const mappedCategoryNames = categoryNames.map(name => CATEGORY_MAPPINGS[name] || name);
      
      // For count, we'll use a direct join instead of CTE
      countWhereConditions.push(
        inArray(
          categories.name, 
          mappedCategoryNames
        )
      );
    }

    // Add search filter if needed
    if (filters.search?.trim()) {
      const searchTerm = `%${filters.search}%`;
      const searchConditions = [
        ilike(news.title, searchTerm),
        ilike(news.seo_title, searchTerm),
        ilike(news.seo_description, searchTerm),
        ilike(news.content_md, searchTerm)
      ].filter(Boolean);
      
      if (searchConditions.length > 0) {
        const searchCondition = or(...searchConditions);
        if (searchCondition) {
          countWhereConditions.push(searchCondition);
        }
      }
    }

    // Build the count query
    let countQuery;
    if (filters.category) {
      // With category filtering
      countQuery = db
        .select({ count: sql<number>`count(distinct ${news.id})` })
        .from(news)
        .innerJoin(news_categories, eq(news.id, news_categories.news_id))
        .innerJoin(categories, eq(news_categories.category_id, categories.id))
        .where(and(...countWhereConditions));
    } else {
      // Without category filtering
      countQuery = db
        .select({ count: sql<number>`count(${news.id})` })
        .from(news)
        .where(and(...countWhereConditions));
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count) || 0;

    console.log('🔍 Count result:', total);

    // 1. First, get the distinct news items with pagination
    const newsQuery = db
      .with(...withQueries)
      .select({
        // News fields
        id: news.id,
        source_guid: news.source_guid,
        source_id: news.source_id,
        title: news.title,
        seo_title: news.seo_title,
        seo_description: news.seo_description,
        excerpt: news.excerpt,
        content_md: news.content_md,
        slug: news.slug,
        canonical_url: news.canonical_url,
        status: news.status,
        visibility: news.visibility,
        word_count: news.word_count,
        reading_time_min: news.reading_time_min,
        published_at: news.published_at,
        created_at: news.created_at,
        updated_at: news.updated_at,
        // Media fields
        media_external_url: media.external_url,
        media_storage_path: media.storage_path,
        media_alt_text: media.alt_text,
        media_caption: media.caption,
      })
      .from(news)
      .leftJoin(media, eq(news.main_media_id, media.id))
      .where(and(...whereConditions))
      .orderBy(desc(news.published_at), desc(news.created_at))
      .limit(filters.limit)
      .offset(offset);

    // 2. Get the news items
    const newsItems = await newsQuery;
    const newsIds = newsItems.map(item => item.id);

    console.log('🔍 Fetched news items:', newsItems.length);

    // 3. Fetch related data in parallel
    const [categoriesData, tagsData] = await Promise.all([
      // Categories
      newsIds.length > 0 ? db
        .select({
          news_id: news_categories.news_id,
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .innerJoin(news_categories, eq(categories.id, news_categories.category_id))
        .where(inArray(news_categories.news_id, newsIds)) : [],
      
      // Tags
      newsIds.length > 0 ? db
        .select({
          news_id: news_tags.news_id,
          id: tags.id,
          name: tags.name,
        })
        .from(tags)
        .innerJoin(news_tags, eq(tags.id, news_tags.tag_id))
        .where(inArray(news_tags.news_id, newsIds)) : []
    ]);

    // 4. Group related data by news_id
    type CategoryItem = { news_id: number; id: number; name: string };
    type TagItem = { news_id: number; id: number; name: string };

    const categoriesByNewsId: Record<number, CategoryItem[]> = {};
    const tagsByNewsId: Record<number, TagItem[]> = {};

    for (const item of categoriesData) {
      if (!categoriesByNewsId[item.news_id]) categoriesByNewsId[item.news_id] = [];
      categoriesByNewsId[item.news_id].push(item);
    }

    for (const item of tagsData) {
      if (!tagsByNewsId[item.news_id]) tagsByNewsId[item.news_id] = [];
      tagsByNewsId[item.news_id].push(item);
    }

    // 5. Build the final response
    const items = newsItems.map(newsItem => {
      const newsId = newsItem.id;
      const newsCategories = categoriesByNewsId[newsId] || [];
      const newsTags = tagsByNewsId[newsId] || [];

      // Get the first category for the main category field
      const mainCategory = newsCategories[0]?.name || 'General';
      
      // Get all unique category names
      const allCategories = [...new Set(newsCategories.map(c => c.name))];
      
      // Get all unique tag names
      const allTags = [...new Set(newsTags.map(t => t.name))];

      return {
        id: String(newsItem.id),
        source_guid: newsItem.source_guid || '',
        source_id: newsItem.source_id || '',
        seo_title: newsItem.seo_title || newsItem.title || '',
        seo_description: newsItem.seo_description || newsItem.excerpt || '',
        tldr: [], // TLDR removed as requested
        content_md: newsItem.content_md || '',
        category: mainCategory,
        categories: allCategories,
        tags: allTags,
        image: newsItem.media_external_url || newsItem.media_storage_path || '',
        image_title: newsItem.media_alt_text || newsItem.media_caption || '',
        image_desc: newsItem.media_caption || newsItem.media_alt_text || '',
        original_url: newsItem.canonical_url || '',
        file_path: newsItem.media_storage_path || '',
        created_at: newsItem.created_at?.toISOString() || new Date().toISOString(),
        published_at: (newsItem.published_at || newsItem.created_at)?.toISOString() || new Date().toISOString(),
        updated_at: (newsItem.updated_at || newsItem.created_at)?.toISOString() || new Date().toISOString(),
        slug: newsItem.slug || '',
        read_time: typeof newsItem.reading_time_min === 'number' ? newsItem.reading_time_min : 0,
        is_bookmarked: undefined
      } as NewsItem;
    });

    console.log('🔍 Processed items:', items.length);

    const response = {
      success: true,
      data: {
        items,
        total,
        page: filters.page,
        limit: filters.limit,
        has_more: offset + filters.limit < total,
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Optimized News API route error:', error);

    // DOĞRU KULLANIM: Gövde, sonra ResponseInit nesnesi
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}