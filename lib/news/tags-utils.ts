import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { tags, news_tags, news } from '@/db/schema';
import { NewsFetchError } from './error-handler';

/**
 * Creates a URL-friendly slug from a tag name
 * @param tag - The tag name to convert to a slug
 * @returns URL-friendly slug string
 */
/**
 * Creates a URL-friendly slug from a tag name
 * @param tag - The tag name to convert to a slug
 * @returns URL-friendly slug string
 */
export const createTagSlug = (tag: string): string => {
  if (!tag || typeof tag !== 'string') return 'news';
  
  return tag
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
    .substring(0, 100);        // Limit length to 100 chars
};

/**
 * Processes an array of tag names and returns an array of tag objects with slugs
 * @param tagNames - Array of tag names from the API
 * @returns Array of tag objects with name and slug
 */
/**
 * Processes an array of tag names and returns an array of tag objects with slugs
 * @param tagNames - Array of tag names from the API
 * @returns Array of tag objects with name and slug
 */
export const processTags = (tagNames: string[]): Array<{ name: string; slug: string }> => {
  // Validate input
  if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
    return [{ name: 'News', slug: 'news' }];
  }
  
  // Filter out invalid tag names
  const validTagNames = tagNames.filter(
    tag => tag && typeof tag === 'string' && tag.trim().length > 0
  );
  
  if (validTagNames.length === 0) {
    return [{ name: 'News', slug: 'news' }];
  }

  // Process each tag and create a unique set of tags
  const uniqueTags = new Map<string, string>();
  
  for (const tagName of validTagNames) {
    try {
      const trimmedName = tagName.trim();
      const slug = createTagSlug(trimmedName);
      
      if (!uniqueTags.has(slug)) {
        // Format the display name (title case)
        const displayName = trimmedName
          .split(/\s+/)
          .map(word => 
            word.length > 0 
              ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              : ''
          )
          .join(' ')
          .trim();
        
        // Only add if we have a valid display name
        if (displayName) {
          uniqueTags.set(slug, displayName);
        }
      }
    } catch (error) {
      console.error(`Error processing tag '${tagName}':`, error);
      continue;
    }
  }

  // If no valid tags, return default
  if (uniqueTags.size === 0) {
    return [{ name: 'News', slug: 'news' }];
  }

  // Convert map to array of objects
  return Array.from(uniqueTags.entries()).map(([slug, name]) => ({
    name,
    slug,
  }));
};

/**
 * Gets or creates the default 'news' tag
 * @returns Promise that resolves to the default tag ID
 */
const getDefaultTagId = async (): Promise<number> => {
  try {
    // Try to find existing 'news' tag
    const [defaultTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, 'news'))
      .limit(1);

    if (defaultTag) {
      return defaultTag.id;
    }

    // Create default 'news' tag if it doesn't exist
    const [newTag] = await db
      .insert(tags)
      .values({
        name: 'News',
        slug: 'news',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning({ id: tags.id });

    return newTag.id;
  } catch (error) {
    console.error('Error getting/setting default tag:', error);
    throw new NewsFetchError(
      'Failed to get or create default tag',
      'TAG_ERROR',
      error as Error
    );
  }
};

/**
 * Ensures tags exist in the database and returns their IDs
 * @param tagNames - Array of tag names from the API
 * @returns Promise that resolves to an array of tag IDs
 */
export const ensureTagsExist = async (tagNames: string[]): Promise<number[]> => {
  if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
    return [await getDefaultTagId()];
  }

  try {
    // Process tags to get unique names and slugs
    const processedTags = processTags(tagNames);
    
    // If no valid tags after processing, return default
    if (processedTags.length === 0) {
      return [await getDefaultTagId()];
    }
    
    const tagSlugs = processedTags.map((tag: { slug: string }) => tag.slug);
    
    // Find existing tags in a single query
    const existingTags = await db
      .select()
      .from(tags)
      .where(sql`${tags.slug} IN ${tagSlugs}`);
    
    const existingSlugs = new Set(existingTags.map((tag: { slug: string }) => tag.slug));
    const newTags = processedTags.filter((tag: { slug: string }) => !existingSlugs.has(tag.slug));
    
    // Insert new tags in a single batch
    if (newTags.length > 0) {
      const now = new Date();
      const tagsToInsert = newTags.map((tag: { name: string; slug: string }) => ({
        name: tag.name,
        slug: tag.slug,
        created_at: now,
        updated_at: now,
      }));
      
      const insertedTags = await db
        .insert(tags)
        .values(tagsToInsert)
        .returning({ id: tags.id });
      
      return [
        ...existingTags.map((t: { id: number }) => t.id), 
        ...insertedTags.map((t: { id: number }) => t.id)
      ];
    }
    
    return existingTags.map((tag: { id: number }) => tag.id);
  } catch (error) {
    console.error('Error ensuring tags exist:', error);
    return [await getDefaultTagId()];
  }
};

/**
 * Process and save tags from API response
 * @param tagNames - Array of tag names from the API
 * @returns Promise that resolves to an array of tag IDs
 */
/**
 * Update tags for an existing news item
 * @param newsId - The ID of the news item to update
 * @param tagNames - Array of tag names to associate with the news item
 * @returns Promise that resolves when the update is complete
 */
export const updateNewsTags = async (newsId: number, tagNames: string[]): Promise<void> => {
  try {
    // First, remove all existing tag associations for this news item
    await db
      .delete(news_tags)
      .where(eq(news_tags.news_id, newsId));

    // Get or create the tags and get their IDs
    const tagIds = await ensureTagsExist(tagNames);

    // Create new tag associations
    if (tagIds.length > 0) {
      await db
        .insert(news_tags)
        .values(
          tagIds.map(tagId => ({
            news_id: newsId,
            tag_id: tagId,
            created_at: new Date()
          }))
        );
    }

    // Update the news item's updated_at timestamp
    await db
      .update(news)
      .set({ updated_at: new Date() })
      .where(eq(news.id, newsId));

  } catch (error) {
    console.error(`Error updating tags for news item ${newsId}:`, error);
    throw new NewsFetchError(
      'Failed to update news tags',
      'TAG_UPDATE_ERROR',
      error as Error
    );
  }
};

export const processAndSaveTags = async (tagNames: string[]): Promise<number[]> => {
  try {
    const tagIds = await ensureTagsExist(tagNames);
    
    // Ensure we have at least one tag
    if (tagIds.length === 0) {
      return [await getDefaultTagId()];
    }
    
    return tagIds;
  } catch (error) {
    console.error('Error in processAndSaveTags:', error);
    
    // Fallback to default tag on any error
    try {
      return [await getDefaultTagId()];
    } catch (innerError) {
      console.error('Critical: Could not get default tag:', innerError);
      throw new NewsFetchError(
        'Failed to process tags and could not fall back to default tag',
        'TAG_ERROR',
        error as Error
      );
    }
  }
};
