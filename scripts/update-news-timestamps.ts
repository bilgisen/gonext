// scripts/update-news-timestamps-fixed.ts
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, eq, isNotNull, asc } from 'drizzle-orm';

/**
 * Updates timestamps for all news articles in the database while preserving order
 */
async function updateNewsTimestamps() {
  console.log('🚀 Starting news timestamps update (preserving order)...');
  
  try {
    // 1. Fetch all news articles ordered by their original ID to preserve order
    console.log('📥 Fetching all news articles in order...');
    
    const allNews = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          isNotNull(news.published_at)
        )
      )
      .orderBy(asc(news.id)); // Order by ID to preserve original order

    console.log(`📊 Found ${allNews.length} news articles to process`);

    // 2. Process each article with sequential timestamps
    let updatedCount = 0;
    
    // Start from October 29, 2023 and increment by 1 hour for each article
    let currentDate = new Date('2023-10-29T00:00:00.000Z');
    
    for (const newsItem of allNews) {
      try {
        // Increment by 1 hour for each article
        currentDate.setHours(currentDate.getHours() + 1);
        
        // Create a new Date object for this article
        const articleDate = new Date(currentDate);
        
        // Update the article with the new timestamp
        await db
          .update(news)
          .set({
            created_at: articleDate,
            published_at: articleDate,
            updated_at: articleDate
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
    // Set the start date to October 29, 2023
    const startDate = new Date('2023-10-29T00:00:00.000Z');
    console.log(`📅 Articles are now ordered from ${startDate.toISOString()} to ${currentDate.toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error updating news timestamps:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateNewsTimestamps();