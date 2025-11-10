import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  news,
  categories,
  news_categories,
  news_tags,
  media,
  news_media,
  sources,
  import_logs
} from '../../db/schema';
import { processAndSaveTags } from './tags-utils';
import type { 
  NewsInsertData, 
  NewsApiItem
} from './types';
import { 
  NewsFetchError,
  ValidationError
} from './types';
import { createSlug, createUniqueSlug } from './slug-utils';
import { generateNewsTimestamps, formatTurkishDate } from './date-utils';
import { processMarkdownContent } from './html-content';
import { checkDuplicateNews } from './duplicate-check';
import { parseNewsDate } from '@/lib/utils/date-utils';
import { processNewsImage } from './image-processor'; // Import the image processing function

/**
 * Source'u bulur veya oluşturur
 * @param baseUrl - Source base URL
 * @returns Source ID
 */
export async function findOrCreateSource(baseUrl: string): Promise<number> {
  try {
    // Önce mevcut source'u ara
    const existingSource = await db
      .select()
      .from(sources)
      .where(eq(sources.base_url, baseUrl))
      .limit(1);

    if (existingSource.length > 0) {
      return existingSource[0].id;
    }

    // Yeni source oluştur
    const newSource = await db
      .insert(sources)
      .values({
        name: new URL(baseUrl).hostname,
        base_url: baseUrl,
        created_at: new Date(),
      })
      .returning();

    return newSource[0].id;
  } catch (error) {
    throw new NewsFetchError(
      'Failed to find or create source',
      'SOURCE_ERROR',
      error as Error
    );
  }
}

/**
 * Category'yi bulur veya oluşturur
 * @param categoryName - Category name
 * @returns Category ID
 */
// Normalizes Turkish characters in strings
const normalizeTurkishChars = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[ı]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[âîû]/g, (match) => ({
      'â': 'a',
      'î': 'i',
      'û': 'u'
    }[match] || match));
};

export async function findOrCreateCategory(categoryName: string): Promise<number> {
  try {
    if (!categoryName || typeof categoryName !== 'string') {
      // Return default category (turkiye) if no valid category name is provided
      const defaultCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, 'turkiye'))
        .limit(1);
      
      if (defaultCategory.length > 0) {
        return defaultCategory[0].id;
      }
      throw new Error('Default category not found');
    }

    // Normalize the category name for comparison
    const normalizedCategoryName = normalizeTurkishChars(categoryName);
    
    // First, try to find by name (case-insensitive and Turkish character insensitive)
    const existingCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        sql`LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${categories.name},
          'ü', 'u'), 'ğ', 'g'), 'ş', 's'), 'ö', 'o'), 'ç', 'c'), 'ı', 'i')) = LOWER(${normalizeTurkishChars(categoryName)})`
      )
      .limit(1);

    if (existingCategories.length > 0) {
      return existingCategories[0].id;
    }

    // If not found by name, try by slug
    const slug = createSlug(normalizedCategoryName, { maxLength: 50 });
    const existingBySlug = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existingBySlug.length > 0) {
      return existingBySlug[0].id;
    }

    // If still not found, create a new category
    console.log(`Creating new category: ${normalizedCategoryName} (${slug})`);
    
    try {
      const newCategory = await db
        .insert(categories)
        .values({
          name: normalizedCategoryName, // Use normalized name for consistency
          slug,
          is_active: true, // Explicitly set is_active
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning({ id: categories.id });

      return newCategory[0].id;
    } catch (error) {
      const insertError = error as Error & { code?: string };
      
      // If there's a unique constraint violation on slug, try to find the category again
      if (insertError.code === '23505') { // Unique violation
        const existing = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, slug))
          .limit(1);
          
        if (existing.length > 0) {
          return existing[0].id;
        }
      }
      throw insertError;
    }
  } catch (error) {
    console.error(`Error in findOrCreateCategory for "${categoryName}":`, error);
    
    // Fallback to default category (turkiye)
    try {
      const defaultCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, 'turkiye'))
        .limit(1);
        
      if (defaultCategory.length > 0) {
        return defaultCategory[0].id;
      }
      
      // If we can't find the default category, try to create it
      const newDefault = await db
        .insert(categories)
        .values({
          name: 'Türkiye',
          slug: 'turkiye',
          created_at: new Date(),
        })
        .returning();
        
      return newDefault[0].id;
    } catch (fallbackError) {
      console.error('Failed to use fallback category:', fallbackError);
      throw new NewsFetchError(
        `Failed to find or create category: ${categoryName}`,
        'CATEGORY_ERROR',
        error as Error
      );
    }
  }
}

/**
 * Tag'leri bulur veya oluşturur
 * @param tagNames - Tag names array
 * @returns Tag IDs array
 */
export async function findOrCreateTags(tagNames: string[]): Promise<number[]> {
  try {
    // Use the new processAndSaveTags utility to handle tag processing and saving
    return await processAndSaveTags(tagNames);
  } catch (error) {
    throw new NewsFetchError(
      'Failed to find or create tags',
      'TAG_ERROR',
      error as Error
    );
  }
}

/**
 * Media record oluşturur
 * @param imageData - Image upload result
 * @returns Media ID
 */
export async function createMediaRecord(imageData: {
  url: string;
  path: string;
  metadata: any;
}): Promise<number> {
  try {
    const newMedia = await db
      .insert(media)
      .values({
        external_url: imageData.url,
        storage_path: imageData.path,
        width: imageData.metadata.width,
        height: imageData.metadata.height,
        mime_type: `image/${imageData.metadata.format}`,
        alt_text: '', // TODO: Extract from news content
        filesize: imageData.metadata.size,
        created_at: new Date(),
      })
      .returning();

    return newMedia[0].id;
  } catch (error) {
    throw new NewsFetchError(
      'Failed to create media record',
      'MEDIA_ERROR',
      error as Error
    );
  }
}

/**
 * News record'ını oluşturur
 * @param apiItem - API'den gelen haber
 * @param insertData - Database'e insert edilecek data
 * @returns News ID
 */
/**
 * Creates a new news record in the database
 * @param _apiItem - The original API item (currently unused but kept for future use)
 * @param insertData - The data to insert into the database
 * @returns The ID of the created news record
 */
export async function createNewsRecord(
  _apiItem: NewsApiItem,
  insertData: NewsInsertData
): Promise<number> {
  try {
    // Ensure required fields are present
    if (!insertData.title) {
      throw new ValidationError('Title is required', 'title');
    }
    if (!insertData.slug) {
      throw new ValidationError('Slug is required', 'slug');
    }
    if (!insertData.source_guid) {
      throw new ValidationError('Source GUID is required', 'source_guid');
    }

    // Prepare the data for insertion
    const now = new Date();
    const newsData = {
      title: insertData.title,
      slug: insertData.slug,
      source_guid: insertData.source_guid,
      source_id: insertData.source_id ? String(insertData.source_id) : undefined,
      seo_title: insertData.seo_title || insertData.title,
      seo_description: insertData.seo_description || '',
      excerpt: insertData.excerpt || '',
      content_md: insertData.content_md || '',
      content_html: insertData.content_html || '',
      tldr_count: insertData.tldr?.length || 0,
      main_media_id: insertData.main_media_id || undefined,
      canonical_url: insertData.canonical_url || null,
      status: insertData.status || 'draft',
      visibility: insertData.visibility || 'public',
      editor_id: insertData.editor_id || undefined,
      word_count: insertData.word_count || 0,
      reading_time_min: insertData.reading_time_min || insertData.read_time || 0,
      published_at: insertData.published_at 
        ? (() => {
            // Convert to string if it's a Date object
            const dateString = insertData.published_at instanceof Date 
              ? insertData.published_at.toISOString() 
              : String(insertData.published_at);
            return parseNewsDate(dateString) || new Date();
          })() 
        : new Date(),
      created_at: insertData.created_at ? new Date(insertData.created_at) : now,
      updated_at: insertData.updated_at ? new Date(insertData.updated_at) : now,
      meta: insertData.meta ? JSON.stringify(insertData.meta) : null,
      source_fk: insertData.source_fk || undefined
    };

    const newNews = await db
      .insert(news)
      .values(newsData)
      .returning();

    if (!newNews[0]?.id) {
      throw new NewsFetchError('Failed to create news record: No ID returned', 'NEWS_CREATE_ERROR');
    }

    return newNews[0].id;
  } catch (error) {
    throw new NewsFetchError(
      'Failed to create news record',
      'NEWS_CREATE_ERROR',
      error as Error
    );
  }
}

/**
 * News'i categories ile ilişkilendirir
 * @param newsId - News ID
 * @param categoryIds - Category IDs array
 */
export async function linkNewsToCategories(newsId: number, categoryIds: number[]): Promise<void> {
  try {
    for (const categoryId of categoryIds) {
      await db
        .insert(news_categories)
        .values({
          news_id: newsId,
          category_id: categoryId,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Failed to link news to categories:', error);
    // Non-critical error, don't throw
  }
}

/**
 * News'i tags ile ilişkilendirir
 * @param newsId - News ID
 * @param tagIds - Tag IDs array
 */
export async function linkNewsToTags(newsId: number, tagIds: number[]): Promise<void> {
  try {
    for (const tagId of tagIds) {
      await db
        .insert(news_tags)
        .values({
          news_id: newsId,
          tag_id: tagId,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Failed to link news to tags:', error);
    // Non-critical error, don't throw
  }
}

/**
 * News'i media ile ilişkilendirir (main image)
 * @param newsId - News ID
 * @param mediaId - Media ID
 */
export async function linkNewsToMedia(newsId: number, mediaId: number): Promise<void> {
  try {
    await db
      .insert(news_media)
      .values({
        news_id: newsId,
        media_id: mediaId,
        is_main: true,
        position: 0,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Failed to link news to media:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Ana news insert fonksiyonu
 * @param apiItem - API'den gelen haber
 * @param options - Insert options
 * @returns Inserted news ID
 */
export async function insertNews(
  apiItem: NewsApiItem,
  options: {
    processImage?: boolean;
    skipDuplicates?: boolean;
  } = {}
): Promise<number> {
  const { processImage = true, skipDuplicates = true } = options;

  try {
    // Check for duplicate
    if (skipDuplicates) {
      const isDuplicate = await checkDuplicateNews(apiItem);
      if (isDuplicate) {
        throw new ValidationError(`News already exists: ${apiItem.source_guid}`, 'source_guid');
      }
    }

    // Get or create source
    const sourceUrl = new URL(apiItem.original_url).origin;
    const sourceId = await findOrCreateSource(sourceUrl);

    // Get category from API response
    const categoryName = apiItem.category || 'turkiye';
    const categoryId = await findOrCreateCategory(categoryName);

    // Process tags - ensure tags is an array of strings
    const tagNames = Array.isArray(apiItem.tags) 
      ? apiItem.tags.map(tag => typeof tag === 'string' ? tag : tag.name || String(tag))
      : [];
    const tagIds = tagNames.length > 0 ? await findOrCreateTags(tagNames) : [];

    // Generate unique slug
    const existingSlugs = await db
      .select({ slug: news.slug })
      .from(news)
      .then((rows: { slug: string }[]) => rows.map(row => row.slug));

    const baseSlug = createSlug(apiItem.seo_title);
    const slug = createUniqueSlug(baseSlug, existingSlugs);

    // Process image if needed
    let mainMediaId: number | undefined;
    const imageUrl = apiItem.image_url || apiItem.image;
    if (processImage && imageUrl) {
      try {
        // Use the image processor to download, process, and upload to Netlify CDN
        const imageResult = await processNewsImage(
          imageUrl,
          apiItem.seo_title,
          { width: 800, height: 600, quality: 85 }
        );

        if (imageResult.success && imageResult.url) {
          // Create a media record with the processed image data from Netlify CDN
          mainMediaId = await createMediaRecord({
            url: imageResult.url, // This is now the Netlify CDN URL
            path: imageResult.path || '', // The storage path in the CDN
            metadata: imageResult.metadata || {}, // Metadata from the processed image
          });
        } else {
          console.warn(`Image processing failed for ${imageUrl}, reason: ${imageResult.error}`);
          // Optionally, you could still store the external URL if processing fails
          // const [mediaRecord] = await db.insert(media).values({
          //   original_name: imageUrl.split('/').pop() || 'image.jpg',
          //   external_url: imageUrl,
          //   mime_type: 'image/jpeg',
          //   alt_text: (apiItem.image_alt || apiItem.image_title || '').substring(0, 1024),
          //   caption: (apiItem.image_caption || apiItem.image_desc || '').substring(0, 2000),
          //   created_at: new Date(),
          //   updated_at: new Date()
          // }).returning({ id: media.id });
          // if (mediaRecord) mainMediaId = mediaRecord.id;
        }
      } catch (error) {
        console.error('Image processing failed:', error);
        // Continue without image
      }
    }

    // Calculate reading time
    const wordCount = apiItem.content_md.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Prepare insert data - handle all possible API response formats
    const title = apiItem.title || 
                 apiItem.seo_title || 
                 apiItem.original_url?.split('/').pop()?.replace(/-/g, ' ') || 
                 'Untitled';
    
    const seoTitle = apiItem.seo_title || title;
    const seoDescription = apiItem.seo_description || 
                          apiItem.excerpt || 
                          title.substring(0, 160);
    
    // Generate sequential timestamps for the article in Istanbul timezone
    const { created_at, published_at } = generateNewsTimestamps();
    
    // Debug log for timestamps
    const [createdAtFormatted, publishedAtFormatted] = await Promise.all([
      formatTurkishDate(created_at),
      formatTurkishDate(published_at)
    ]);
    
    console.log('Generated timestamps:', {
      created_at: createdAtFormatted,
      published_at: publishedAtFormatted
    });

    // Ensure source_id is always a string or undefined for Drizzle
    const sourceIdValue = apiItem.id != null ? String(apiItem.id) : undefined;
    
    // Process markdown content to HTML
    const processedContent = processMarkdownContent({
      content_md: apiItem.content_md || '',
      content_html: apiItem.content_html || ''
    });

    // Create insert data with proper types for the database
    const insertData = {
      title,
      slug,
      source_guid: apiItem.source_guid || sourceIdValue || '',
      source_id: sourceIdValue, // Already converted to string or undefined
      source_fk: sourceId || undefined, // Convert null to undefined for Drizzle
      excerpt: seoDescription.substring(0, 200),
      content_md: apiItem.content_md || '',
      content_html: processedContent.content_html,
      seo_title: seoTitle,
      seo_description: seoDescription,
      status: 'published' as const,
      visibility: 'public' as const,
      word_count: wordCount,
      reading_time_min: readingTime,
      published_at: published_at,
      created_at: created_at,
      updated_at: new Date(),
      canonical_url: apiItem.original_url || null,
      main_media_id: mainMediaId || undefined, // Convert null to undefined for Drizzle
      meta: {
        tldr: apiItem.tldr || [],
        file_path: apiItem.file_path || '',
        image_url: apiItem.image || apiItem.image_url || '',
        image_alt: apiItem.image_alt || apiItem.image_title || '',
        image_caption: apiItem.image_caption || apiItem.image_desc || ''
      }
    } satisfies Omit<NewsInsertData, 'id' | 'editor_id'>;

    // Prepare the data for insertion with proper types for Drizzle
    const insertValues = {
      ...insertData,
      source_id: insertData.source_id as string | undefined, // Ensure string or undefined
      source_fk: insertData.source_fk || null,
      main_media_id: insertData.main_media_id || null,
      published_at: insertData.published_at || new Date(),
      created_at: insertData.created_at || new Date(),
      updated_at: insertData.updated_at || new Date(),
    };

    // Insert news record with proper typing
    const [insertedNews] = await db.insert(news)
      .values(insertValues as any) // Type assertion to handle Drizzle's strict types
      .returning({ id: news.id });

    if (!insertedNews) {
      throw new Error('Failed to insert news');
    }

    const newsId = insertedNews.id;

    // Link categories    // Link news to categories
    if (categoryId) {
      await db.insert(news_categories).values({
        news_id: newsId,
        category_id: categoryId
        // created_at is auto-generated in the schema
      });
    }

    // Link news to tags
    if (tagIds.length > 0) {
      await db.insert(news_tags).values(
        tagIds.map(tagId => ({
          news_id: newsId,
          tag_id: tagId,
          created_at: new Date()
        }))
      );
    }

    // Link media if exists    // Link news to media (main image)
    if (mainMediaId) {
      await db.insert(news_media).values({
        news_id: newsId,
        media_id: mainMediaId,
        is_main: true, // Changed from is_featured to is_main to match schema
        position: 1 // Add position as it's required
      });
    }

    // Create import log
    await db.insert(import_logs).values({
      source_id: sourceId,
      external_file: apiItem.original_url || '',
      imported_at: new Date(),
      imported_count: 1,
      meta: {
        source: 'news-fetch-cli',
        source_guid: apiItem.source_guid,
        status: 'completed',
        error_count: 0,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    return newsId;
  } catch (error) {
    console.error('Error in insertNews:', error);
    throw error;
  }
}

/**
 * Import log oluşturur
 * @param sourceId - Source ID
 * @param importedCount - Imported count
 * @param meta - Additional metadata
 */
export async function createImportLog(
  sourceId: number,
  importedCount: number,
  meta: any = {}
): Promise<void> {
  try {
    await db
      .insert(import_logs)
      .values({
        source_id: sourceId,
        imported_count: importedCount,
        imported_at: new Date(),
        meta,
      });
  } catch (error) {
    console.error('Failed to create import log:', error);
    // Non-critical error
  }
}