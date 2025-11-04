// app/api/news/route.ts
import { db } from '@/db/client';
import { and, eq, desc, sql, inArray, or, ilike, asc } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';
import { 
  news, 
  categories, 
  tags, 
  media, 
  news_categories, 
  news_tags 
} from '@/db/schema';
import { CATEGORY_MAPPINGS, NewsItem, NewsListResponse } from '@/types/news';
import { generateNewsTimestamps } from '@/lib/news/date-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters = {
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20, // Default 20
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || 'newest', // Default to 'newest'
    };

    // Validate and set limits
    filters.limit = Math.min(50, Math.max(1, filters.limit)); // Max 50, Min 1
    
    // If offset is provided, use it directly, otherwise calculate from page
    let offset: number;
    if (filters.offset !== undefined) {
      offset = Math.max(0, filters.offset); // Ensure offset is not negative
    } else {
      const page = Math.max(1, filters.page || 1);
      offset = (page - 1) * filters.limit;
    }

    console.log('📡 API Request:', { filters, url: request.url });

    // Initialize query conditions with the base filter
    const whereConditions = [eq(news.status, 'published')]; // Base filter
    const withQueries: any[] = []; // For CTE (WITH) clauses

    // Kategori filtresi - artık sadece slug'ları kullanıyoruz
    if (filters.category) {
      const categorySlugs = filters.category.split(',').map(cat => cat.trim().toLowerCase());
      console.log('🔍 Looking for categories by slug:', categorySlugs);

      // Doğrudan slug üzerinden arama yap
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(sql`LOWER(${categories.slug})`, categorySlugs));
        
      console.log('🔍 Category query result:', categoryResult);

      if (categoryResult.length > 0) {
        const categoryIds = categoryResult.map(row => row.id);
        
        // Directly add the category filter to the where conditions
        whereConditions.push(inArray(news_categories.category_id, categoryIds));
      } else {
        console.warn('⚠️ No valid categories found with slugs:', categorySlugs);
        // Return empty result if no categories found
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
      // First, find the tag ID
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(sql`LOWER(${tags.name})`, filters.tag.toLowerCase()));

      if (tagResult.length > 0) {
        const tagId = tagResult[0].id;
        
        // Create a subquery to find news items with this tag
        const newsWithTag = db.$with('news_with_tag').as(
          db.selectDistinct({ news_id: news_tags.news_id })
            .from(news_tags)
            .where(eq(news_tags.tag_id, tagId))
        );
        
        // Add the join condition to the main query
        whereConditions.push(
          inArray(news.id, db.select({ id: newsWithTag.news_id }).from(newsWithTag))
        );
        
        // Add the WITH clause to the main query
        withQueries.push(newsWithTag);
      } else {
        // If tag doesn't exist, return empty result
        console.log(`Tag '${filters.tag}' not found`);
        return NextResponse.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: filters.page || 1,
            limit: filters.limit,
            has_more: false,
          },
        });
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

    // Create a new array for where conditions that we can modify
    const finalWhereConditions = [...whereConditions];
    
    // Add category filter if provided
    if (filters.category) {
      // Convert category slug to lowercase for case-insensitive comparison
      const categorySlug = filters.category.toLowerCase();
      const categoryCondition = eq(sql`LOWER(${categories.slug})`, categorySlug);
      finalWhereConditions.push(categoryCondition);
    }

    // Define the news item result type based on the database schema
    type NewsItemResult = {
      id: number;
      source_guid: string;
      source_id: string | null;
      title: string;
      seo_title: string | null;
      seo_description: string | null;
      excerpt: string | null;
      content_md: string | null;
      slug: string;
      canonical_url: string | null;
      status: string | null;
      visibility: string | null;
      word_count: number | null;
      reading_time_min: number | null;
      published_at: Date | null;
      created_at: Date | null;  // Made nullable
      updated_at: Date | null;  // Made nullable
      media_external_url: string | null;
      media_storage_path: string | null;
      media_alt_text: string | null;
      media_caption: string | null;
    };

    // Determine sort order based on the sort parameter
    let orderByClause;
    switch (filters.sort) {
      case 'oldest':
        orderByClause = [asc(news.published_at), asc(news.created_at)];
        break;
      case 'popular':
        // Fall back to sorting by published_at in descending order for popularity
        orderByClause = [desc(news.published_at), desc(news.created_at)];
        break;
      case 'newest':
      default:
        orderByClause = [desc(news.published_at), desc(news.created_at)];
        break;
    }

    // Create a base query builder with all the necessary joins
    const baseQuery = db
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
      .innerJoin(news_categories, eq(news.id, news_categories.news_id))
      .innerJoin(categories, eq(news_categories.category_id, categories.id))
      .where(and(...finalWhereConditions))
      .orderBy(...orderByClause)
      .limit(filters.limit)
      .offset(offset);

    // Execute the query with CTEs if we have any
    let newsItems: NewsItemResult[] = [];
    
    try {
      if (withQueries.length > 0) {
        // For CTEs, we need to build the query differently
        const cte = withQueries[0];
        const result = await db
          .with(cte)
          .select()
          .from(baseQuery.as('subquery'))
          .innerJoin(cte, sql`${cte}.news_id = subquery.id`);
          
        newsItems = Array.isArray(result) ? result.map(r => r.subquery) : [];
      } else {
        // Direct query without CTEs
        const result = await baseQuery;
        newsItems = Array.isArray(result) ? result : [];
      }
    } catch (error) {
      console.error('Error fetching news items:', error);
      newsItems = [];
    }
      
    console.log('📊 Query details:', { 
      limit: filters.limit, 
      offset,
      whereConditions,
      itemCount: newsItems.length
    });

    const newsIds = newsItems.map((item) => String(item.id));

    // 3. Fetch related data in parallel
    const [categoriesData, tagsData] = await Promise.all([
      // Categories
      newsIds.length > 0 ? db
        .select({
          news_id: news_categories.news_id,
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .innerJoin(news_categories, eq(categories.id, news_categories.category_id))
        .where(inArray(sql`${news_categories.news_id}::int`, newsIds.map(id => parseInt(id, 10)))) : Promise.resolve([]),
      
      // Tags
      newsIds.length > 0 ? db
        .select({
          news_id: news_tags.news_id,
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
        })
        .from(tags)
        .innerJoin(news_tags, eq(tags.id, news_tags.tag_id))
        .where(inArray(sql`${news_tags.news_id}::int`, newsIds.map(id => parseInt(id, 10)))) : Promise.resolve([]),
    ]);

    // 4. Group related data by news_id
    type CategoryItem = { news_id: number; id: number; name: string; slug: string };
    type TagItem = { news_id: number; id: number; name: string; slug: string };

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
    let items = newsItems.map(newsItem => {
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
        // We'll update these timestamps with our custom logic
        created_at: newsItem.created_at?.toISOString() || new Date().toISOString(),
        published_at: (newsItem.published_at || newsItem.created_at)?.toISOString() || new Date().toISOString(),
        updated_at: (newsItem.updated_at || newsItem.created_at)?.toISOString() || new Date().toISOString(),
        slug: newsItem.slug || '',
        read_time: typeof newsItem.reading_time_min === 'number' ? newsItem.reading_time_min : 0,
        is_bookmarked: undefined
      } as NewsItem;
    });

    // Only generate fresh timestamps if sort is not by date
    // This preserves the original timestamps for date-based sorting
    if (filters.sort !== 'newest' && filters.sort !== 'oldest') {
      items = items.map((item) => {
        // Generate new timestamps for each item
        const timestamps = generateNewsTimestamps();
        
        return {
          ...item,
          created_at: timestamps.created_at.toISOString(),
          published_at: timestamps.published_at.toISOString(),
          updated_at: timestamps.published_at.toISOString()
        };
      });
    }

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