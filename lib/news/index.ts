import { NewsApiResponse, NewsApiItem, FetchNewsOptions, NewsFetchError } from './types';
import { fetchNewsFromApi } from './api-client';
import { insertNews } from './db-operations';
import { getDuplicateStats } from './duplicate-check';
import { createImportLog } from './db-operations';
import { sql } from 'drizzle-orm';
import { fetchNewsFromTest } from './test-fetch';

/**
 * Import sonuçları
 */
export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{
    item: NewsApiItem;
    error: string;
    code: string;
  }>;
  duration: number;
}

/**
 * News fetch ve import ana fonksiyonu
 * @param options - Fetch options
 * @returns Import sonuçları
 */
export async function fetchNews(options: FetchNewsOptions = {}): Promise<ImportResult> {
  const startTime = Date.now();
  const { limit = 50, offset = 0, force = false } = options;

  const result: ImportResult = {
    success: false,
    totalProcessed: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    duration: 0,
  };

  try {
    console.log(`🚀 Starting news fetch - limit: ${limit}, offset: ${offset}`);

    // Test mode kontrolü
    const testMode = process.env.TEST_MODE === 'true';

    // API'den haberleri çek
    const apiResponse: NewsApiResponse = testMode
      ? await fetchNewsFromTest()
      : await fetchNewsFromApi(limit, offset);
    result.totalProcessed = apiResponse.items.length;

    if (result.totalProcessed === 0) {
      console.log('📭 No new items to process');
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`📊 Processing ${result.totalProcessed} items...`);

    // Duplicate istatistikleri
    if (!force) {
      const duplicateStats = await getDuplicateStats(apiResponse.items);
      result.skipped = duplicateStats.duplicates;
      result.imported = duplicateStats.new;

      console.log(`📈 Duplicate stats: ${duplicateStats.duplicates} duplicates, ${duplicateStats.new} new items`);
    }

    // Her haberi işle
    for (const apiItem of apiResponse.items) {
      try {
        // Force değilse ve duplicate varsa atla
        if (!force) {
          const isDuplicate = await import('./duplicate-check').then(m => m.checkDuplicateNews(apiItem));
          if (isDuplicate) {
            result.skipped++;
            continue;
          }
        }

        // News'i database'e insert et
        await insertNews(apiItem, {
          processImage: true,
          skipDuplicates: !force,
        });

        result.imported++;
        console.log(`✅ Imported: ${apiItem.seo_title.substring(0, 50)}...`);

      } catch (error) {
        result.errors++;

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorCode = error instanceof NewsFetchError ? error.code : 'UNKNOWN_ERROR';

        result.errorDetails.push({
          item: apiItem,
          error: errorMessage,
          code: errorCode,
        });

        console.error(`❌ Failed to import: ${apiItem.seo_title.substring(0, 50)}...`, errorMessage);

        // Critical error'larda dur (duplicate error hariç)
        if (errorCode !== 'VALIDATION_ERROR' || !errorMessage.includes('already exists')) {
          // Continue processing other items
        }
      }
    }

    // Import log oluştur
    if (result.imported > 0) {
      try {
        const sourceUrl = new URL(apiResponse.items[0].original_url).origin;
        const sourceId = await import('./db-operations').then(m =>
          m.findOrCreateSource(sourceUrl)
        );
        await createImportLog(sourceId, result.imported, {
          total_processed: result.totalProcessed,
          skipped: result.skipped,
          errors: result.errors,
          limit,
          offset,
        });
      } catch (error) {
        console.error('Failed to create import log:', error);
      }
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(`🎉 Import completed successfully!`);
    console.log(`📊 Results: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
    console.log(`⏱️ Duration: ${result.duration}ms`);

    return result;

  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors++;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof NewsFetchError ? error.code : 'UNKNOWN_ERROR';

    result.errorDetails.push({
      item: {} as NewsApiItem, // Can't provide specific item for global error
      error: errorMessage,
      code: errorCode,
    });

    console.error('💥 Fatal error during news fetch:', errorMessage);

    return result;
  }
}

/**
 * Incremental fetch - sadece yeni haberleri çeker
 * @param options - Fetch options
 * @returns Import sonuçları
 */
export async function fetchNewsIncremental(options: FetchNewsOptions = {}): Promise<ImportResult> {
  return fetchNews({ ...options, force: false });
}

/**
 * Force fetch - duplicate kontrolü yapmadan tüm haberleri çeker
 * @param options - Fetch options
 * @returns Import sonuçları
 */
export async function fetchNewsForce(options: FetchNewsOptions = {}): Promise<ImportResult> {
  return fetchNews({ ...options, force: true });
}

/**
 * Batch fetch - çoklu batch'ler halinde fetch yapar
 * @param totalLimit - Toplam çekilecek haber sayısı
 * @param batchSize - Her batch'teki haber sayısı
 * @returns Tüm import sonuçları
 */
export async function fetchNewsBatch(
  totalLimit: number = 500,
  batchSize: number = 50
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  const batches = Math.ceil(totalLimit / batchSize);

  console.log(`📦 Starting batch fetch - ${batches} batches of ${batchSize} items each`);

  for (let i = 0; i < batches; i++) {
    const offset = i * batchSize;
    const limit = Math.min(batchSize, totalLimit - offset);

    console.log(`🔄 Processing batch ${i + 1}/${batches} (offset: ${offset}, limit: ${limit})`);

    try {
      const batchResult = await fetchNews({ limit, offset, force: false });
      results.push(batchResult);

      // Rate limiting - API'yi yormamak için
      if (i < batches - 1) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`💥 Batch ${i + 1} failed:`, error);
      // Continue with next batch
    }
  }

  // Summary
  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  console.log(`📊 Batch fetch summary:`);
  console.log(`✅ Total imported: ${totalImported}`);
  console.log(`⏭️ Total skipped: ${totalSkipped}`);
  console.log(`❌ Total errors: ${totalErrors}`);

  return results;
}

/**
 * API health check ve stats
 * @returns System status
 */
export async function getSystemStatus(): Promise<{
  apiHealthy: boolean;
  databaseConnected: boolean;
  lastImport?: Date;
  totalNews: number;
}> {
  const status = {
    apiHealthy: false,
    databaseConnected: false,
    lastImport: undefined as Date | undefined,
    totalNews: 0,
  };

  // API health check
  try {
    const { checkApiHealth } = await import('./api-client');
    status.apiHealthy = await checkApiHealth();
  } catch (error) {
    console.error('API health check failed:', error);
  }

  // Database connection check
  try {
    const { db } = await import('../../db/client');
    await db.execute(sql`SELECT 1`);
    status.databaseConnected = true;

    // Get total news count
    const { news } = await import('../../db/schema');
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(news);
    status.totalNews = countResult[0].count;

    // Get last import
    const { import_logs } = await import('../../db/schema');
    const lastImportResult = await db
      .select()
      .from(import_logs)
      .orderBy(sql`${import_logs.imported_at} DESC`)
      .limit(1);

    if (lastImportResult.length > 0) {
      status.lastImport = lastImportResult[0].imported_at;
    }

  } catch (error) {
    console.error('Database check failed:', error);
  }

  return status;
}
