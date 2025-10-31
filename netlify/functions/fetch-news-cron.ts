import { Config } from "@netlify/functions";
import {
  fetchNewsIncremental,
  fetchNewsBatch,
  getSystemStatus,
  ImportResult
} from "../../lib/news/index";
import { PerformanceMonitor } from "../../lib/news/error-handler";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_FORCE = false;

const fetchNewsScheduledFunction = async (_req: Request, context: { next_run?: string }) => {
  console.log("🚀 Scheduled Function Triggered");
  if (context.next_run) {
    console.log("Next run:", context.next_run);
  }

  const limit = parseInt(process.env.FETCH_NEWS_LIMIT || String(DEFAULT_LIMIT), 10);
  const offset = parseInt(process.env.FETCH_NEWS_OFFSET || String(DEFAULT_OFFSET), 10);
  const batchSize = parseInt(process.env.FETCH_NEWS_BATCH_SIZE || String(DEFAULT_BATCH_SIZE), 10);
  const force = process.env.FETCH_NEWS_FORCE === "true" || DEFAULT_FORCE;

  console.log(`📊 Options: limit=${limit}, offset=${offset}, batchSize=${batchSize}, force=${force}`);

  try {
    let result: ImportResult | ImportResult[];

    if (batchSize && limit > batchSize) {
      console.log(`📦 Batch processing...`);
      const results = await fetchNewsBatch(limit, batchSize);
      result = results;
    } else {
      console.log(`🔄 Incremental fetch...`);
      result = await fetchNewsIncremental({ limit, offset, force });
    }

    // 'result' değişkenini TypeScript uyarısını önlemek ve değerini loglamak için kullanıyoruz.
    console.log("📊 Fetch result summary:", result);

    const status = await getSystemStatus();
    console.log(`✅ API Healthy: ${status.apiHealthy}`);
    console.log(`✅ DB Connected: ${status.databaseConnected}`);
    console.log(`📰 Total News: ${status.totalNews}`);

    const metrics = PerformanceMonitor.getMetrics() as Record<string, { count: number; averageTime: number }>;
    for (const [op, m] of Object.entries(metrics)) {
      console.log(`  ${op}: ${m.count} ops, ${Math.round(m.averageTime)}ms avg`);
    }

    // Zamanlanmış fonksiyon olduğu için bir yanıt döndürmüyoruz.
    // return { statusCode: 200, body: JSON.stringify(...) }; satırı kaldırıldı.
    // return; // Veya bu satırı da kaldırabilirsiniz, fonksiyon zaten burada bitecek ve undefined dönecek.
  } catch (error) {
    console.error("💥 Scheduled Function Error:", error);
    // Hata durumunda da bir şey döndürmeden fonksiyonu sonlandırıyoruz.
    // Netlify, hatayı loglayacaktır.
    // throw error; // Alternatif: Hatanın loglanmasını sağlamak için fırlatabilirsiniz.
  }
};

export default fetchNewsScheduledFunction;

export const config: Config = {
  schedule: "0,15,30,45 * * * *",
};