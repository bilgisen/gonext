import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client'; // Database connection import edilecek
import { news } from '../../db/schema';
import { DuplicateError, NewsApiItem } from './types';

/**
 * Haber duplicate olup olmadığını kontrol eder
 * @param apiItem - API'den gelen haber
 * @returns Duplicate ise true, değilse false
 */
export async function checkDuplicateNews(apiItem: NewsApiItem): Promise<boolean> {
  try {
    // source_guid ile kontrol (primary duplicate check)
    const guidCheck = await db
      .select()
      .from(news)
      .where(eq(news.source_guid, apiItem.source_guid))
      .limit(1);

    if (guidCheck.length > 0) {
      return true;
    }

    // source_id ile kontrol (fallback)
    if (apiItem.id) {
      const idCheck = await db
        .select()
        .from(news)
        .where(eq(news.source_id, apiItem.id))
        .limit(1);

      if (idCheck.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking duplicate news:', error);
    // Database error durumunda false döneriz, duplicate olarak kabul etmeyiz
    return false;
  }
}

/**
 * Bulk duplicate check
 * @param apiItems - API'den gelen haberler array
 * @returns Duplicate olan haberlerin ID'leri
 */
export async function checkBulkDuplicates(apiItems: NewsApiItem[]): Promise<string[]> {
  try {
    const duplicates: string[] = [];

    // Tüm source_guid'leri topla
    const sourceGuids = apiItems.map(item => item.source_guid);
    const sourceIds = apiItems.map(item => item.id).filter(Boolean);

    // Database query ile tüm duplicate'ları bir kerede kontrol et
    let existingNews: any[] = [];

    if (sourceGuids.length > 0) {
      const guidResults = await db
        .select({
          source_guid: news.source_guid,
          source_id: news.source_id,
        })
        .from(news)
        .where(inArray(news.source_guid, sourceGuids));
      existingNews.push(...guidResults);
    }

    if (sourceIds.length > 0) {
      const idResults = await db
        .select({
          source_guid: news.source_guid,
          source_id: news.source_id,
        })
        .from(news)
        .where(inArray(news.source_id, sourceIds));
      existingNews.push(...idResults);
    }

    // Her API item için duplicate kontrolü
    for (const apiItem of apiItems) {
      const isDuplicate = existingNews.some(existing =>
        existing.source_guid === apiItem.source_guid ||
        (apiItem.id && existing.source_id === apiItem.id)
      );

      if (isDuplicate) {
        duplicates.push(apiItem.id || apiItem.source_guid);
      }
    }

    return duplicates;
  } catch (error) {
    console.error('Error checking bulk duplicates:', error);
    // Hata durumunda boş array döneriz
    return [];
  }
}

/**
 * Haber zaten varsa güncelleme yapar, yoksa hata fırlatır
 * @param apiItem - API'den gelen haber
 * @param throwOnDuplicate - Duplicate ise hata fırlat
 * @returns Duplicate kontrol sonucu
 */
export async function handleDuplicateCheck(
  apiItem: NewsApiItem,
  throwOnDuplicate: boolean = true
): Promise<{ isDuplicate: boolean; existingNews?: any }> {
  const isDuplicate = await checkDuplicateNews(apiItem);

  if (isDuplicate && throwOnDuplicate) {
    throw new DuplicateError(
      `News already exists with source_guid: ${apiItem.source_guid}`,
      'source_guid'
    );
  }

  return { isDuplicate };
}

/**
 * Veritabanında duplicate haber olup olmadığını kontrol eder ve detayları döner
 * @param apiItem - API'den gelen haber
 * @returns Duplicate haber bilgileri
 */
export async function findExistingNews(apiItem: NewsApiItem): Promise<any | null> {
  try {
    const existing = await db
      .select()
      .from(news)
      .where(eq(news.source_guid, apiItem.source_guid))
      .limit(1);

    return existing[0] || null;
  } catch (error) {
    console.error('Error finding existing news:', error);
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
