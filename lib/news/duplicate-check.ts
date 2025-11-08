import { eq, or, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { news } from '../../db/schema';
import type { NewsApiItem } from './types';

// Make all fields optional except id and source_guid to match the database schema
type ExistingNewsItem = {
  id: number;
  source_guid: string;
  source_id?: string | null;
  source_fk?: number | null;
  title?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  excerpt?: string | null;
  content?: string | null;
  content_html?: string | null;
  image_url?: string | null;
  main_media_id?: number | null;
  status?: string | null;
  published_at?: Date | null;
  created_at?: Date;
  updated_at?: Date | null;
  slug?: string;
  view_count?: number;
  // Allow any other properties that might come from the database
  [key: string]: any;
};
import { DuplicateError } from './error-handler';
import { updateNewsImageIfChanged } from './image-handler';

// Simple console logger if the logger module is not available
const logger = {
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || '')
};


/**
 * Checks if a news item is a duplicate using source_guid and id fields
 * @param apiItem - News item from API
 * @returns Promise<boolean> - true if duplicate exists
 */
export async function checkDuplicateNews(apiItem: NewsApiItem): Promise<boolean> {
  try {
    // Check for duplicates using source_guid and id
    const [existing] = await db
      .select({ id: news.id })
      .from(news)
      .where(
        or(
          // Match by source_guid (primary key)
          eq(news.source_guid, apiItem.source_guid),
          // Or match by source_id if available
          ...(apiItem.id ? [eq(news.source_id, String(apiItem.id))] : [])
        )
      )
      .limit(1);
    
    return !!existing;
  } catch (error) {
    logger.error('Error checking duplicate news', {
      error,
      source_guid: apiItem.source_guid,
      source_id: apiItem.id
    });
    
    // In case of error, assume it's not a duplicate to avoid data loss
    return false;
  }
}

/**
 * Bulk duplicate check using source_guid and id fields
 * @param apiItems - Array of news items from API
 * @returns Array of duplicate item IDs
 */
export async function checkBulkDuplicates(apiItems: NewsApiItem[]): Promise<string[]> {
  if (apiItems.length === 0) return [];
  
  try {
    // Extract all source_guids and ids for batch checking
    const sourceGuids = apiItems.map(item => item.source_guid);
    const sourceIds = apiItems
      .map(item => item.id)
      .filter((id): id is string => id !== undefined && id !== null)
      .map(String);
    
    // Find all potential duplicates in a single query
    const duplicates = await db
      .select({
        source_guid: news.source_guid,
        source_id: news.source_id
      })
      .from(news)
      .where(
        or(
          inArray(news.source_guid, sourceGuids),
          ...(sourceIds.length > 0 ? [inArray(news.source_id, sourceIds)] : [])
        )
      );
    
    // Convert to sets for O(1) lookups
    const duplicateGuids = new Set(
      duplicates.map(d => d.source_guid).filter(Boolean) as string[]
    );
    
    const duplicateIds = new Set(
      duplicates.map(d => d.source_id).filter(Boolean) as string[]
    );
    
    // Find all items that match any duplicate identifier
    return apiItems
      .filter(item => {
        const hasMatchingGuid = duplicateGuids.has(item.source_guid);
        const hasMatchingId = item.id ? duplicateIds.has(String(item.id)) : false;
        return hasMatchingGuid || hasMatchingId;
      })
      .map(item => item.id || item.source_guid);
  } catch (error) {
    logger.error('Bulk duplicate check failed', { error });
    throw new Error('Failed to check for duplicates in bulk');
  }
}

/**
 * Handles duplicate checking with proper error handling and logging
 * @param apiItem - News item to check
 * @param throwOnDuplicate - Whether to throw on duplicate
 * @returns Object with duplicate status and existing news if found
 */
export async function handleDuplicateCheck(
  apiItem: NewsApiItem,
  throwOnDuplicate: boolean = true
): Promise<{ isDuplicate: boolean; existingNews?: any }> {
  try {
    const existing = await findExistingNews(apiItem);
    
    if (existing) {
      logger.info('Found duplicate news item', {
        source_guid: apiItem.source_guid,
        source_id: apiItem.id,
        title: apiItem.seo_title?.substring(0, 100)
      });
      
      if (throwOnDuplicate) {
        throw new DuplicateError(
          `News with source_guid ${apiItem.source_guid} already exists`,
          'source_guid'
        );
      }
      return { isDuplicate: true, existingNews: existing };
    }
    
    return { isDuplicate: false };
  } catch (error) {
    logger.error('Error during duplicate check', {
      error,
      source_guid: apiItem.source_guid,
      source_id: apiItem.id
    });
    
    if (error instanceof DuplicateError) {
      throw error;
    }
    
    throw new Error(
      `Duplicate check failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Finds an existing news item using source_guid and id
 * @param apiItem - News item to find
 * @returns The existing news item or null if not found
 */
export async function findExistingNews(apiItem: NewsApiItem): Promise<ExistingNewsItem | null> {
  try {
    const [existing] = await db
      .select()
      .from(news)
      .where(
        or(
          eq(news.source_guid, apiItem.source_guid),
          ...(apiItem.id ? [eq(news.source_id, String(apiItem.id))] : [])
        )
      )
      .limit(1);
    
    if (!existing) return null;

    // Check if the image needs to be updated
    if (apiItem.image) {
      try {
        await updateNewsImageIfChanged(existing, apiItem);
      } catch (error) {
        logger.error('Error updating news image', { error, newsId: existing.id });
      }
    }
    
    return existing;
  } catch (error) {
    logger.error('Error finding existing news', {
      error,
      source_guid: apiItem.source_guid,
      source_id: apiItem.id
    });
    return null;
  }
}

/**
 * Duplicate haberlerin istatistiklerini döner
 * @param apiItems - Kontrol edilecek API haberleri
 * @returns Duplicate istatistikleri
 */
export async function getDuplicateStats(apiItems: NewsApiItem[]): Promise<{
  total: number;
  duplicates: number;
  new: number;
  duplicateIds: string[];
}> {
  const duplicateIds = await checkBulkDuplicates(apiItems);

  return {
    total: apiItems.length,
    duplicates: duplicateIds.length,
    new: apiItems.length - duplicateIds.length,
    duplicateIds,
  };
}
