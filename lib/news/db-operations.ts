import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  news,
  categories,
  tags,
  news_categories,
  news_tags,
  media,
  news_media,
  sources,
  import_logs
} from '../../db/schema';
import {
  NewsInsertData,
  NewsApiItem,
  NewsFetchError,
  ValidationError
} from './types';
import { createSlug, createUniqueSlug } from './slug-utils';
import { extractCategoryFromUrl, createCategorySlug } from './category-utils';
import { CATEGORY_MAPPINGS } from '../../types/news';
import { processNewsImage } from './image-processor';
import { checkDuplicateNews } from './duplicate-check';

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
export async function findOrCreateCategory(categoryName: string): Promise<number> {
  try {
    const slug = createCategorySlug(categoryName);

    // Önce mevcut category'yi ara
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return existingCategory[0].id;
    }

    // Yeni category oluştur
    const newCategory = await db
      .insert(categories)
      .values({
        name: categoryName,
        slug,
        created_at: new Date(),
      })
      .returning();

    return newCategory[0].id;
  } catch (error) {
    throw new NewsFetchError(
      'Failed to find or create category',
      'CATEGORY_ERROR',
      error as Error
    );
  }
}

/**
 * Tag'leri bulur veya oluşturur
 * @param tagNames - Tag names array
 * @returns Tag IDs array
 */
export async function findOrCreateTags(tagNames: string[]): Promise<number[]> {
  try {
    const tagIds: number[] = [];

    for (const tagName of tagNames) {
      const slug = createCategorySlug(tagName);

      // Önce mevcut tag'i ara
      const existingTag = await db
        .select()
        .from(tags)
        .where(eq(tags.slug, slug))
        .limit(1);

      if (existingTag.length > 0) {
        tagIds.push(existingTag[0].id);
        continue;
      }

      // Yeni tag oluştur
      const newTag = await db
        .insert(tags)
        .values({
          name: tagName,
          slug,
          created_at: new Date(),
        })
        .returning();

      tagIds.push(newTag[0].id);
    }

    return tagIds;
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
export async function createNewsRecord(
  apiItem: NewsApiItem,
  insertData: NewsInsertData
): Promise<number> {
  try {
    const newNews = await db
      .insert(news)
      .values({
        ...insertData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

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
    // Duplicate kontrolü
    if (skipDuplicates) {
      const isDuplicate = await checkDuplicateNews(apiItem);
      if (isDuplicate) {
        throw new ValidationError(`News already exists: ${apiItem.source_guid}`, 'source_guid');
      }
    }

    // Source ID bul/oluştur
    const sourceUrl = new URL(apiItem.original_url).origin;
    const sourceId = await findOrCreateSource(sourceUrl);

    // Category çıkar ve oluştur
    const categoryName = apiItem.category || extractCategoryFromUrl(apiItem.original_url);

    // Always use mapped category name for consistency
    const mappedCategoryName = CATEGORY_MAPPINGS[categoryName.toLowerCase()] || categoryName;

    const categoryId = await findOrCreateCategory(mappedCategoryName);

    // Tags oluştur
    const tagIds = await findOrCreateTags(apiItem.tags || []);

    // Slug oluştur (unique)
    const existingSlugs = await db
      .select({ slug: news.slug })
      .from(news)
      .where(sql`1=1`) // Tüm slug'ları al
      .then(rows => rows.map(row => row.slug));

    const baseSlug = createSlug(apiItem.seo_title);
    const slug = createUniqueSlug(baseSlug, existingSlugs);

    // Image processing
    let mainMediaId: number | undefined;
    if (processImage && apiItem.image) {
      try {
        const imageResult = await processNewsImage(
          apiItem.image,
          apiItem.seo_title,
          { width: 800, height: 600, quality: 85 }
        );

        if (imageResult.success && imageResult.url) {
          mainMediaId = await createMediaRecord({
            url: imageResult.url,
            path: imageResult.path || '',
            metadata: imageResult.metadata || {},
          });
        }
      } catch (error) {
        console.error('Image processing failed:', error);
        // Continue without image
      }
    }

    // Reading time hesapla
    const wordCount = apiItem.content_md.split(/\s+/).length;
    const readingTimeMin = Math.ceil(wordCount / 200); // 200 words per minute

    // Insert data hazırla
    const insertData: NewsInsertData = {
      source_guid: apiItem.source_guid,
      source_id: apiItem.id,
      source_fk: sourceId,
      title: apiItem.seo_title,
      seo_title: apiItem.seo_title,
      seo_description: apiItem.seo_description,
      excerpt: apiItem.seo_description.substring(0, 200),
      content_md: apiItem.content_md,
      main_media_id: mainMediaId,
      slug,
      canonical_url: apiItem.original_url,
      status: 'published',
      visibility: 'public',
      word_count: wordCount,
      reading_time_min: readingTimeMin,
      published_at: new Date(apiItem.published_at || apiItem.created_at),
      meta: {
        tldr: apiItem.tldr,
        image_title: apiItem.image_title,
        image_desc: apiItem.image_desc,
        file_path: apiItem.file_path,
      },
    };

    // News record oluştur
    const newsId = await createNewsRecord(apiItem, insertData);

    // Relations oluştur
    await linkNewsToCategories(newsId, [categoryId]);
    await linkNewsToTags(newsId, tagIds);

    if (mainMediaId) {
      await linkNewsToMedia(newsId, mainMediaId);
    }

    return newsId;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NewsFetchError) {
      throw error;
    }

    throw new NewsFetchError(
      'Failed to insert news',
      'INSERT_ERROR',
      error as Error
    );
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
