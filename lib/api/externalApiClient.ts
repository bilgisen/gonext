import type { NewsItem, NewsListResponse } from '../../types/news';
import { db } from '../../db/client';
import { news, news_categories, news_tags, categories, tags, media } from '../../db/schema';
import { desc, asc, sql, and, eq, like, inArray } from 'drizzle-orm';

// Database-based API client for news
class DatabaseApiClient {
  private async transformDbNewsToNewsItem(dbNews: any): Promise<NewsItem> {
    // Get categories for this news item
    const newsCats = await db
      .select({ name: categories.name })
      .from(news_categories)
      .innerJoin(categories, eq(news_categories.category_id, categories.id))
      .where(eq(news_categories.news_id, dbNews.id));

    // Get tags for this news item
    const newsTags = await db
      .select({ name: tags.name })
      .from(news_tags)
      .innerJoin(tags, eq(news_tags.tag_id, tags.id))
      .where(eq(news_tags.news_id, dbNews.id));

    // Get main image if exists
    let image = '';
    let imageTitle = '';
    if (dbNews.main_media_id) {
      const mediaResult = await db
        .select()
        .from(media)
        .where(eq(media.id, dbNews.main_media_id))
        .limit(1);

      if (mediaResult.length > 0) {
        image = mediaResult[0].external_url || mediaResult[0].storage_path || '';
        imageTitle = mediaResult[0].alt_text || mediaResult[0].caption || '';
      }
    }

    return {
      id: dbNews.id.toString(),
      source_guid: dbNews.source_guid,
      source_id: dbNews.source_id,
      seo_title: dbNews.seo_title || dbNews.title,
      seo_description: dbNews.seo_description || dbNews.excerpt || '',
      tldr: [], // Will be populated from news_tldr table if needed
      content_md: dbNews.content_md || '',
      category: newsCats.length > 0 ? newsCats[0].name : 'General',
      tags: newsTags.map(tag => tag.name),
      image: image,
      image_title: imageTitle,
      image_desc: '',
      original_url: dbNews.canonical_url || '',
      file_path: '',
      created_at: dbNews.created_at?.toISOString() || '',
      published_at: dbNews.published_at?.toISOString() || dbNews.created_at?.toISOString() || '',
      updated_at: dbNews.updated_at?.toISOString() || '',
      slug: dbNews.slug,
      read_time: dbNews.reading_time_min || undefined,
      is_bookmarked: false,
    };
  }

  async getNews(filters: {
    category?: string;
    tag?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<NewsListResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    // Filter by status (only published news)
    whereConditions.push(eq(news.status, 'published'));

    // Filter by category if provided
    if (filters.category) {
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.name, filters.category))
        .limit(1);

      if (categoryResult.length > 0) {
        whereConditions.push(
          sql`EXISTS (
            SELECT 1 FROM news_categories nc
            WHERE nc.news_id = news.id
            AND nc.category_id = ${categoryResult[0].id}
          )`
        );
      }
    }

    // Filter by tag if provided
    if (filters.tag) {
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, filters.tag))
        .limit(1);

      if (tagResult.length > 0) {
        whereConditions.push(
          sql`EXISTS (
            SELECT 1 FROM news_tags nt
            WHERE nt.news_id = news.id
            AND nt.tag_id = ${tagResult[0].id}
          )`
        );
      }
    }

    // Search in title, content, or seo fields
    if (filters.search) {
      whereConditions.push(
        sql`(
          ${news.title} ILIKE ${'%' + filters.search + '%'} OR
          ${news.seo_title} ILIKE ${'%' + filters.search + '%'} OR
          ${news.seo_description} ILIKE ${'%' + filters.search + '%'} OR
          ${news.content_md} ILIKE ${'%' + filters.search + '%'}
        )`
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(whereClause);

    const total = countResult[0].count;

    // Get news items with pagination
    const dbNewsItems = await db
      .select()
      .from(news)
      .where(whereClause)
      .orderBy(desc(news.published_at), desc(news.created_at))
      .limit(limit)
      .offset(offset);

    // Transform to NewsItem format
    const items = await Promise.all(
      dbNewsItems.map(item => this.transformDbNewsToNewsItem(item))
    );

    return {
      items,
      total,
      page,
      limit,
      has_more: offset + limit < total,
    };
  }

  async getNewsById(id: string): Promise<NewsItem> {
    // First try to find by slug (for Next.js routing)
    let dbNewsItem = await db
      .select()
      .from(news)
      .where(eq(news.slug, id))
      .limit(1);

    // If not found by slug, try by numeric ID
    if (dbNewsItem.length === 0) {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid news identifier: ${id}`);
      }

      dbNewsItem = await db
        .select()
        .from(news)
        .where(eq(news.id, numericId))
        .limit(1);
    }

    if (dbNewsItem.length === 0) {
      throw new Error(`News item not found: ${id}`);
    }

    return this.transformDbNewsToNewsItem(dbNewsItem[0]);
  }
}

// Export singleton instance
export const databaseApiClient = new DatabaseApiClient();

// Service functions
export const newsService = {
  async getNews(filters: Parameters<typeof databaseApiClient.getNews>[0] = {}) {
    try {
      return await databaseApiClient.getNews(filters);
    } catch (error) {
      console.error('Failed to fetch news from database:', error);
      throw error;
    }
  },

  async getNewsById(id: string) {
    try {
      return await databaseApiClient.getNewsById(id);
    } catch (error) {
      console.error(`Failed to fetch news ${id} from database:`, error);
      throw error;
    }
  },
};

// Export getNewsList as alias
export const getNewsList = newsService.getNews;

// Export getNewsById as alias for backward compatibility
export const getNewsById = newsService.getNewsById;
