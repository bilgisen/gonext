// scripts/update-news-timestamps.ts
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';
import { generateNewsTimestamps } from '@/lib/news/date-utils';

/**
 * Updates timestamps for all news articles in the database
 */
async function updateNewsTimestamps() {
  console.log('🚀 Starting news timestamps update...');
  
  try {
    // 1. Fetch all news articles
    console.log('📥 Fetching all news articles...');
    
    const allNews = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          isNotNull(news.published_at)
        )
      )
      .orderBy(news.id);

    console.log(`📊 Found ${allNews.length} news articles to process`);

    // 2. Process each article
    let updatedCount = 0;
    
    for (const newsItem of allNews) {
      try {
        // Generate new timestamps using our utility function
        const { created_at, published_at } = generateNewsTimestamps();
        
        // Update the article
        await db
          .update(news)
          .set({
            created_at: new Date(created_at),
            published_at: new Date(published_at),
            updated_at: new Date(published_at) // Same as published_at
          })
          .where(eq(news.id, newsItem.id));
        
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ Processed ${updatedCount} articles...`);
        }
      } catch (error) {
        console.error(`❌ Error updating article ${newsItem.id}:`, error);
      }
    }
    
    console.log(`\n✨ Successfully updated timestamps for ${updatedCount} news articles`);
    
  } catch (error) {
    console.error('❌ Error updating news timestamps:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateNewsTimestamps();
