import { and, eq, sql, inArray, desc, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  news,
  news_categories,
  categories,
  news_tags,
  tags,
  media,
  editors
} from '@/db/schema';
import type { NewsItem, NewsListResponse, NewsFilters } from '@/types/news';
import { CATEGORY_MAPPINGS, type Category as NewsCategory } from '@/types/news';

// NewsWithViews type is now inferred from the query

// Database-based API client for news
class DatabaseApiClient {
  private async transformDbNewsToNewsItem(dbNews: any): Promise<NewsItem> {
    // Get categories for this news item
    const categoriesResult = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug
      })
      .from(categories)
      .innerJoin(news_categories, eq(categories.id, news_categories.category_id))
      .where(eq(news_categories.news_id, dbNews.id));

    // Get tags for this news item
    const tagsResult = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug
      })
      .from(tags)
      .innerJoin(news_tags, eq(tags.id, news_tags.tag_id))
      .where(eq(news_tags.news_id, dbNews.id));

    // Get main image if exists
    let imageUrl = '';
    let imageTitle = '';
    let imageDesc = '';
    
    if (dbNews.main_media_id) {
      const mediaResult = await db
        .select()
        .from(media)
        .where(eq(media.id, dbNews.main_media_id))
        .limit(1);

      if (mediaResult.length > 0) {
        const mediaItem = mediaResult[0];
        imageUrl = mediaItem.external_url || mediaItem.storage_path || '';
        imageTitle = mediaItem.alt_text || '';
        imageDesc = mediaItem.caption || '';
      }
    }

    // Get author info
    let authorName = '';
    let authorAvatar = '';
    
    if (dbNews.editor_id) {
      const authorResult = await db
        .select()
        .from(editors)
        .where(eq(editors.id, dbNews.editor_id))
        .leftJoin(media, eq(editors.avatar_media_id, media.id))
        .limit(1);

      if (authorResult.length > 0) {
        authorName = authorResult[0].editors?.name || '';
        authorAvatar = authorResult[0].media?.storage_path || '';
      }
    }

    const categorySlugs = categoriesResult.map(cat => cat.slug);
    const primaryCategory = categorySlugs[0] as NewsCategory || 'turkiye';

    return {
      id: dbNews.id.toString(),
      source_id: dbNews.source_id || '',
      source_guid: dbNews.source_guid || '',
      title: dbNews.title,
      slug: dbNews.slug,
      excerpt: dbNews.excerpt,
      content: dbNews.content_md, // Keep for backward compatibility
      content_html: dbNews.content_html || dbNews.content_md, // Add content_html field
      seo_title: dbNews.seo_title || dbNews.title,
      seo_description: dbNews.seo_description || dbNews.excerpt,
      status: dbNews.status,
      featured: dbNews.featured || false,
      view_count: dbNews.view_count || 0,
      read_time: dbNews.reading_time_min || 0,
      published_at: dbNews.published_at?.toISOString() || new Date().toISOString(),
      created_at: dbNews.created_at?.toISOString() || new Date().toISOString(),
      updated_at: dbNews.updated_at?.toISOString() || new Date().toISOString(),
      image_url: imageUrl,
      image_alt: imageTitle,
      image_caption: imageDesc,
      author_id: dbNews.editor_id,
      author_name: authorName,
      author_avatar: authorAvatar,
      source_url: dbNews.canonical_url || '',
      categories: categorySlugs as NewsCategory[],
      tags: tagsResult.map(tag => tag.name),
      meta: {},
      // For backward compatibility
      image: imageUrl,
      category: primaryCategory,
      tldr: [],
      original_url: dbNews.canonical_url || '',
      file_path: '',
      is_bookmarked: false,
    };
  }

  async getNews(filters: NewsFilters = {}): Promise<NewsListResponse> {
    console.log('🔍 getNews filters:', JSON.stringify(filters, null, 2));
    // Use the provided limit or default to 15, with a max of 100
    const limit = Math.min(filters.limit || 15, 100);
    
    // Use provided offset if available, otherwise calculate from page
    const offset = filters.offset !== undefined 
      ? parseInt(filters.offset.toString(), 10) 
      : ((filters.page || 1) - 1) * limit;
      
    console.log('📊 Pagination:', { offset, limit, page: filters.page });
    const whereConditions: SQL[] = [];
    
    // Log all categories in the database
    const allCategories = await db.select().from(categories);
    console.log('📋 Available categories in DB:', allCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));

    // Status filter - temporarily removed for testing
    console.log('ℹ️ Status filter temporarily disabled for testing');

    // Log the count of news items with the current status filter
    const statusCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    console.log(`📊 News count with current filters: ${statusCount[0]?.count || 0}`);

    // Category filter
    if (filters.category) {
      const categorySlugs = Array.isArray(filters.category)
        ? filters.category
        : [filters.category];

      console.log('🔍 Requested category slugs:', categorySlugs);
      
      // Convert all input to lowercase for case-insensitive matching
      const mappedCategories = categorySlugs.map(
        (cat) => {
          const lowerCat = cat.toLowerCase();
          const mapped = CATEGORY_MAPPINGS[lowerCat] || lowerCat;
          console.log(`🔍 Mapped category: ${cat} -> ${mapped}`);
          return mapped;
        }
      );

      // Get all categories for debugging
      const allCategories = await db.select().from(categories);
      console.log('📋 All available categories in DB:', allCategories.map(c => `${c.name} (${c.slug})`));

      // Find categories with case-insensitive matching
      const foundCategories = allCategories.filter(cat => 
        mappedCategories.some(mapped => cat.slug.toLowerCase() === mapped.toLowerCase())
      );
      
      console.log('🔍 Found matching categories:', foundCategories.map(c => `${c.name} (${c.slug})`));

      if (foundCategories.length === 0) {
        console.warn('⚠️ No matching categories found for requested slugs. Available categories:', 
          allCategories.map(c => c.slug).join(', '));
      } else {
        const categorySubquery = db
          .select({ news_id: news_categories.news_id })
          .from(categories)
          .innerJoin(news_categories, eq(categories.id, news_categories.category_id))
          .where(inArray(categories.id, foundCategories.map(c => c.id)));

        whereConditions.push(inArray(news.id, categorySubquery));
      }
    }

    // Tag filter
    if (filters.tag) {
      const tagSubquery = db
        .select({ news_id: news_tags.news_id })
        .from(tags)
        .innerJoin(news_tags, eq(tags.id, news_tags.tag_id))
        .where(eq(tags.slug, filters.tag));

      whereConditions.push(inArray(news.id, tagSubquery));
    }

    // NOTE: Search filter logic has been removed as search will be handled by Algolia
    // The filters.search parameter is ignored in this database client

    const baseQuery = db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        content_md: news.content_md,
        seo_title: news.seo_title,
        seo_description: news.seo_description,
        status: news.status,
        reading_time_min: news.reading_time_min,
        canonical_url: news.canonical_url,
        published_at: news.published_at,
        created_at: news.created_at,
        updated_at: news.updated_at,
        editor_id: news.editor_id,
        main_media_id: news.main_media_id,
        view_count: sql<number>`(SELECT COUNT(*) FROM news_views WHERE news_id = ${news.id})`.as('view_count'),
        media: {
          id: media.id,
          storage_path: media.storage_path,
          external_url: media.external_url,
          alt_text: media.alt_text,
          caption: media.caption,
        },
        editor: {
          id: editors.id,
          name: editors.name,
          email: editors.email,
        },
      })
      .from(news)
      .leftJoin(media, eq(news.main_media_id, media.id))
      .leftJoin(editors, eq(news.editor_id, editors.id));

    // Combine conditions with type safety
    const whereExpr = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const queryWithConditions = whereExpr 
      ? baseQuery.where(whereExpr)
      : baseQuery;

    // Execute the query with proper typing
    const query = queryWithConditions
      .orderBy(desc(news.published_at))
      .offset(offset)
      .limit(limit);
    
    console.log('📊 Query executed with:', { offset, limit });
    
    // Execute count query first
    const countQuery = db.select({ count: sql<number>`count(*)`.as('count') }).from(news);
    const countResult = whereExpr 
      ? await countQuery.where(whereExpr)
      : await countQuery;

    const total = Number(countResult[0]?.count) || 0;
    
    // Execute the main query
    const items = await query;
    
    // Calculate if there are more items
    const has_more = offset + limit < total;

    const newsItems = await Promise.all(
      items.map((item) => {
        const { media: mediaData, editor: editorData, ...newsData } = item;
        return this.transformDbNewsToNewsItem({
          ...newsData,
          view_count: item.view_count || 0,
          main_media_id: mediaData?.id || null,
          editor_id: editorData?.id || null,
        });
      })
    );

    // Calculate page number from offset and limit
    const currentPage = Math.floor(offset / limit) + 1;

    return { 
      items: newsItems, 
      total, 
      page: currentPage, 
      limit, 
      has_more,
      offset
    };
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    // First try to find by slug (for Next.js routing)
    const slugResult = await db
      .select()
      .from(news)
      .where(and(
        eq(news.slug, id),
        eq(news.status, 'published')
      ))
      .leftJoin(media, eq(news.main_media_id, media.id))
      .leftJoin(editors, eq(news.editor_id, editors.id))
      .limit(1);

    if (slugResult.length > 0) {
      return this.transformDbNewsToNewsItem(slugResult[0].news);
    }

    // If not found by slug, try by numeric ID
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error(`Invalid news identifier: ${id}`);
    }

    const idResult = await db
      .select()
      .from(news)
      .where(and(
        eq(news.id, numericId),
        eq(news.status, 'published')
      ))
      .leftJoin(media, eq(news.main_media_id, media.id))
      .leftJoin(editors, eq(news.editor_id, editors.id))
      .limit(1);

    if (idResult.length === 0) {
      throw new Error(`News item not found: ${id}`);
    }

    return this.transformDbNewsToNewsItem(idResult[0].news);
  }
}

// Export singleton instance
export const databaseApiClient = new DatabaseApiClient();

// Service functions
export const newsService = {
  getNews: (filters: NewsFilters = {}) => databaseApiClient.getNews(filters),
  getNewsById: (id: string) => databaseApiClient.getNewsById(id),
};

// Export getNewsList as alias
export const getNewsList = newsService.getNews;

export default databaseApiClient;