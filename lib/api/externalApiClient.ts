import type { NewsItem, NewsListResponse } from '../../types/news';
import { db } from '../../db/client';
import { CATEGORY_MAPPINGS } from '../../types/news';

// Database-based API client for news
class DatabaseApiClient {
  private async transformDbNewsToNewsItem(dbNews: any): Promise<NewsItem> {
    // Get categories for this news item
    const catsResult = await (db as any).execute(`
      SELECT c.name FROM categories c
      INNER JOIN news_categories nc ON c.id = nc.category_id
      WHERE nc.news_id = ${dbNews.id}
    `);

    // Get tags for this news item
    const tagsResult = await (db as any).execute(`
      SELECT t.name FROM tags t
      INNER JOIN news_tags nt ON t.id = nt.tag_id
      WHERE nt.news_id = ${dbNews.id}
    `);

    // Get TL;DR items if they exist
    const tldrResult = await (db as any).execute(`
      SELECT text FROM news_tldr
      WHERE news_id = ${dbNews.id}
      ORDER BY position ASC
    `);

    // Get main image if exists
    let image = '';
    let imageTitle = '';
    let imageDesc = '';
    if (dbNews.main_media_id) {
      const mediaResult = await (db as any).execute(`
        SELECT external_url, storage_path, alt_text, caption
        FROM media WHERE id = ${dbNews.main_media_id}
      `);

      if (mediaResult.rows.length > 0) {
        const media = mediaResult.rows[0] as any;
        image = media.external_url || media.storage_path || '';
        imageTitle = media.alt_text || '';
        imageDesc = media.caption || '';
      }
    }

    const categories = catsResult.rows.map((cat: any) => cat.name);
    const primaryCategory = categories.length > 0 ? categories[0] : 'General';

    return {
      id: dbNews.id.toString(),
      source_guid: dbNews.source_guid || '',
      source_id: dbNews.source_id || '',
      seo_title: dbNews.seo_title || dbNews.title || '',
      seo_description: dbNews.seo_description || dbNews.excerpt || '',
      tldr: tldrResult.rows.map((row: any) => row.text) || [],
      content_md: dbNews.content_md || '',
      category: primaryCategory,
      categories: categories,
      tags: tagsResult.rows.map((tag: any) => tag.name) || [],
      image: image,
      image_title: imageTitle,
      image_desc: imageDesc,
      original_url: dbNews.canonical_url || '',
      file_path: dbNews.storage_path || '',
      created_at: dbNews.created_at?.toISOString() || new Date().toISOString(),
      published_at: dbNews.published_at?.toISOString() || dbNews.created_at?.toISOString() || new Date().toISOString(),
      updated_at: dbNews.updated_at?.toISOString() || dbNews.created_at?.toISOString() || new Date().toISOString(),
      slug: dbNews.slug || '',
      read_time: dbNews.reading_time_min || 0,
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

    console.log('🔍 getNews called with filters:', filters);

    try {
      // Build WHERE conditions
      let whereConditions = ['status = \'published\''];

      if (filters.category) {
        // Map URL parameter to actual category name using CATEGORY_MAPPINGS
        const mappedCategory = CATEGORY_MAPPINGS[filters.category.toLowerCase()] || filters.category;

        console.log('🔍 Looking for category:', mappedCategory);

        // First check if category exists
        try {
          const categoryCheck = await (db as any).execute(`
            SELECT id FROM categories WHERE name = '${mappedCategory.replace(/'/g, "''")}'
          `);

          console.log('🔍 Category check result:', categoryCheck.rows);

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
            return {
              items: [],
              total: 0,
              page,
              limit,
              has_more: false,
            };
          }
        } catch (error) {
          console.error('🔍 Category check failed:', error);
          throw error;
        }
      }

      if (filters.tag) {
        try {
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
        } catch (error) {
          console.error('🔍 Tag check failed:', error);
          throw error;
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

      console.log('🔍 Final WHERE clause:', whereClause);

      // Get total count
      try {
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
            try {
              return await this.transformDbNewsToNewsItem(row);
            } catch (error) {
              console.error('🔍 Transform error for item:', row.id, error);
              throw error;
            }
          })
        );

        return {
          items,
          total,
          page,
          limit,
          has_more: offset + limit < total,
        };
      } catch (error) {
        console.error('🔍 Query execution failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('🔍 getNews failed:', error);
      throw error;
    }
  }

  async getNewsById(id: string): Promise<NewsItem> {
    // First try to find by slug (for Next.js routing)
    const slugResult = await (db as any).execute(`
      SELECT
        id, source_guid, source_id, title, seo_title, seo_description,
        excerpt, content_md, slug, canonical_url, status, visibility,
        word_count, reading_time_min, published_at, created_at, updated_at,
        main_media_id
      FROM news WHERE slug = '${id.replace(/'/g, "''")}' AND status = 'published'
      LIMIT 1
    `);

    let dbNewsItem: any[] = [];
    if (slugResult.rows.length > 0) {
      dbNewsItem = [slugResult.rows[0]];
    } else {
      // If not found by slug, try by numeric ID
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid news identifier: ${id}`);
      }

      const idResult = await (db as any).execute(`
        SELECT
          id, source_guid, source_id, title, seo_title, seo_description,
          excerpt, content_md, slug, canonical_url, status, visibility,
          word_count, reading_time_min, published_at, created_at, updated_at,
          main_media_id
        FROM news WHERE id = ${numericId} AND status = 'published'
        LIMIT 1
      `);

      dbNewsItem = idResult.rows;
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
