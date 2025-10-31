// netlify/functions/fetch-news-cron.ts
import { Config } from "@netlify/functions";
import 'dotenv/config';
import {
  fetchNewsIncremental,
  fetchNewsBatch,
  getSystemStatus,
  ImportResult
} from '../../lib/news/index';
import { PerformanceMonitor } from '../../lib/news/error-handler';

// CLI'den alınan varsayılan değerler
const DEFAULT_LIMIT = 50; // İstediğiniz gibi ayarlayın
const DEFAULT_OFFSET = 0; // Genellikle 0 olur, artımlı çekimde
const DEFAULT_BATCH_SIZE = 50; // İstediğiniz gibi ayarlayın
const DEFAULT_FORCE = false; // İstediğiniz gibi ayarlayın

// Scheduled Function'ı 15 dakikada bir çalıştırmak için cron ifadesi
// 0,15,30,45. dakikada çalışır: "0,15,30,45 * * * *"
const SCHEDULE_CRON = "0,15,30,45 * * * *";

// PerformanceMonitor.getMetrics() dönüş tipi için tanımlama
type PerformanceMetric = {
  count: number;
  averageTime: number;
};
type PerformanceMetrics = Record<string, PerformanceMetric>;

// Scheduled Function'u adlandırılmış bir fonksiyona atayın
const fetchNewsScheduledFunction = async (req: Request /*, context: Context*/) => {
  // Scheduled Function'dan gelen next_run bilgisini alabilirsiniz
  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  if (next_run) {
    console.log("Scheduled function triggered. Next run scheduled for:", next_run);
  } else {
    console.log("Scheduled function triggered. (No next_run timestamp provided by Netlify.)");
  }

  console.log('🚀 Starting Scheduled News Fetch');

  // CLI'deki gibi sabit değerler kullanıyoruz veya process.env üzerinden alabiliriz
  const envLimit = parseInt(process.env.FETCH_NEWS_LIMIT || String(DEFAULT_LIMIT), 10);
  const limit = isNaN(envLimit) ? DEFAULT_LIMIT : envLimit;

  const envOffset = parseInt(process.env.FETCH_NEWS_OFFSET || String(DEFAULT_OFFSET), 10);
  const offset = isNaN(envOffset) ? DEFAULT_OFFSET : envOffset;

  const envBatchSize = parseInt(process.env.FETCH_NEWS_BATCH_SIZE || String(DEFAULT_BATCH_SIZE), 10);
  const batchSize = isNaN(envBatchSize) ? DEFAULT_BATCH_SIZE : envBatchSize;

  const force = process.env.FETCH_NEWS_FORCE === 'true' || DEFAULT_FORCE; // process.env'den al veya DEFAULT_FORCE kullan

  console.log(`📊 Options: limit=${limit}, offset=${offset}, force=${force}, batchSize=${batchSize}`);

  try {
    let result: ImportResult | { totalImported: number; totalSkipped: number; totalErrors: number; batchesProcessed: number };

    if (batchSize && limit > batchSize) {
      console.log(`📦 Using batch processing: ${Math.ceil(limit / batchSize)} batches of ${batchSize}`);
      const results: ImportResult[] = await fetchNewsBatch(limit, batchSize); // Tip güvenliği için açıkça tanımlayın

      const totalImported = results.reduce((sum: number, r: ImportResult) => sum + r.imported, 0);
      const totalSkipped = results.reduce((sum: number, r: ImportResult) => sum + r.skipped, 0);
      const totalErrors = results.reduce((sum: number, r: ImportResult) => sum + r.errors, 0);

      console.log('\n📊 Batch Results:');
      console.log(`✅ Total Imported: ${totalImported}`);
      console.log(`⏭️ Total Skipped: ${totalSkipped}`);
      console.log(`❌ Total Errors: ${totalErrors}`);
      console.log(`📦 Batches Processed: ${results.length}`);

      result = { totalImported, totalSkipped, totalErrors, batchesProcessed: results.length }; // Log için sonuç nesnesi

    } else {
      console.log('🔄 Using incremental fetch');
      const incrementalResult: ImportResult = await fetchNewsIncremental({ limit, offset, force }); // Tip güvenliği için açıkça tanımlayın

      console.log('\n📊 Results:');
      console.log(`📈 Total Processed: ${incrementalResult.totalProcessed}`);
      console.log(`✅ Imported: ${incrementalResult.imported}`);
      console.log(`⏭️ Skipped: ${incrementalResult.skipped}`);
      console.log(`❌ Errors: ${incrementalResult.errors}`);
      console.log(`⏱️ Duration: ${incrementalResult.duration}ms`);

      if (incrementalResult.errors > 0) {
        console.log('\n❌ Error Details:');
        incrementalResult.errorDetails.forEach((error: { item: any; error: string; code: string; }, index: number) => { // Parametre tiplerini belirtin
          console.log(`  ${index + 1}. ${error.error} (${error.code})`);
        });
      }
      result = incrementalResult;
    }

    // Final status
    console.log('\n📊 Final Status:');
    const status = await getSystemStatus();
    console.log(`API Healthy: ${status.apiHealthy ? '✅' : '❌'}`);
    console.log(`Database Connected: ${status.databaseConnected ? '✅' : '❌'}`);
    console.log(`Total News: ${status.totalNews}`);
    if (status.lastImport) {
      console.log(`Last Import: ${status.lastImport.toISOString()}`);
    } else {
      console.log('Last Import: Never');
    }

    // PerformanceMonitor.getMetrics() tipini unknown olarak döndüğü için, uygun bir tipe dönüştürmemiz gerekiyor
    const metrics: PerformanceMetrics = PerformanceMonitor.getMetrics() as PerformanceMetrics; // Tip güvenliği için açıkça tanımlayın
    if (Object.keys(metrics).length > 0) {
      console.log('\n📈 Performance Metrics:');
      Object.entries(metrics).forEach(([operation, metric]) => {
        console.log(`  ${operation}: ${metric.count} ops, ${Math.round(metric.averageTime)}ms avg`);
      });
    }

    // Scheduled Function'lar bir yanıt gövdesi döndürmez, ancak log için bir şey döndürebiliriz
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Scheduled news fetch completed successfully.", next_run, result }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('💥 Scheduled Function Error:', error);
    // Hata durumunda da bir yanıt döndürmelisiniz (log için)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scheduled news fetch failed', details: (error as Error).message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};

export default fetchNewsScheduledFunction;

// Scheduled Function ayarları
// NOT: Eğer netlify.toml dosyasında schedule tanımlıyorsanız, aşağıdaki satırı yorum haline getirin.
export const config: Config = {
  schedule: SCHEDULE_CRON,
  // path: "/api/fetch-news-scheduled", // Scheduled function'lar için path ayarı genellikle geçersizdir
};