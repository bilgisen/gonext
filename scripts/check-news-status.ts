// scripts/check-news-status.ts
import { db } from '../db/client';
import { news } from '../db/schema';
import { desc, sql } from 'drizzle-orm';

async function checkNewsStatus() {
  try {
    console.log('🔍 Checking latest news items...');
    
    const latestNews = await db
      .select({
        id: news.id,
        title: news.title,
        status: news.status,
        publishedAt: news.published_at,
        createdAt: news.created_at,
      })
      .from(news)
      .orderBy(desc(news.created_at))
      .limit(10);

    console.log('📋 Latest 10 news items:');
    console.table(latestNews);

    // Count by status
    const statusCount = await db
      .select({
        status: news.status,
        count: sql<number>`count(*)`,
      })
      .from(news)
      .groupBy(news.status);

    console.log('\n📊 News count by status:');
    console.table(statusCount);

  } catch (error) {
    console.error('❌ Error checking news status:', error);
    process.exit(1);
  }
}

checkNewsStatus();
