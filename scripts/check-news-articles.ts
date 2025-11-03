// scripts/check-news-articles.ts
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, gte, desc, eq, isNotNull } from 'drizzle-orm';

async function checkNewsArticles() {
  try {
    console.log('Checking news articles in the database...');
    
    // Check total number of articles
    const totalArticles = await db.select().from(news);
    console.log(`Total articles in database: ${totalArticles.length}`);
    
    if (totalArticles.length === 0) {
      console.log('No articles found in the database.');
      return;
    }
    
    // Show some sample articles
    console.log('\nSample articles:');
    const samples = totalArticles.slice(0, 3);
    samples.forEach((article, index) => {
      console.log(`\nArticle ${index + 1}:`);
      console.log(`- ID: ${article.id}`);
      console.log(`- Title: ${article.title}`);
      console.log(`- Status: ${article.status}`);
      console.log(`- Visibility: ${article.visibility}`);
      console.log(`- Published At: ${article.published_at}`);
      console.log(`- Updated At: ${article.updated_at}`);
      console.log(`- Slug: ${article.slug}`);
    });
    
    // Check articles that should be in the sitemap
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const recentArticles = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.visibility, 'public'),
          isNotNull(news.published_at),
          gte(news.published_at, twoDaysAgo)
        )
      )
      .orderBy(desc(news.published_at));
      
    console.log(`\nFound ${recentArticles.length} recent articles (published in last 2 days):`);
    recentArticles.forEach(article => {
      console.log(`- ${article.title} (${article.published_at})`);
    });
    
  } catch (error) {
    console.error('Error checking news articles:', error);
  } finally {
    process.exit(0);
  }
}

checkNewsArticles();
