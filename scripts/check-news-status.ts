// scripts/check-news-status.ts
import { db } from '../db';
import { news, categories, news_categories } from '../db/schema';
import { desc, sql, eq } from 'drizzle-orm';

async function checkNewsStatus() {
  try {
    console.log('🔍 Checking database status...');
    
    // 1. Basic counts
    const counts = await db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
        draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)`,
        with_categories: sql<number>`(select count(distinct news_id) from ${news_categories})`,
      })
      .from(news);

    console.log('\n📊 News Counts:');
    console.table(counts[0]);

    // 2. Latest news with status
    const latestNews = await db
      .select({
        id: news.id,
        title: news.title,
        status: news.status,
        published_at: news.published_at,
        created_at: news.created_at,
      })
      .from(news)
      .orderBy(desc(news.created_at))
      .limit(5);

    console.log('\n📋 Latest 5 news items:');
    console.table(latestNews);

    // 3. News with categories
    const newsWithCategories = await db
      .select({
        id: news.id,
        title: news.title,
        status: news.status,
        categories: sql<string>`string_agg(${categories.name}, ', ' order by ${categories.name})`
      })
      .from(news)
      .leftJoin(news_categories, eq(news.id, news_categories.news_id))
      .leftJoin(categories, eq(news_categories.category_id, categories.id))
      .groupBy(news.id, news.title, news.status)
      .limit(5);

    console.log('\n📰 News with categories (sample):');
    console.table(newsWithCategories);

    // 4. Categories with news counts
    const categoriesWithCounts = await db
      .select({
        category: categories.name,
        slug: categories.slug,
        news_count: sql<number>`count(distinct ${news_categories.news_id})`
      })
      .from(categories)
      .leftJoin(news_categories, eq(categories.id, news_categories.category_id))
      .groupBy(categories.id, categories.name, categories.slug);

    console.log('\n🏷️ Categories with news counts:');
    console.table(categoriesWithCounts);

  } catch (error) {
    console.error('❌ Error checking news status:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
checkNewsStatus();
