// scripts/update-all-news-timestamps.ts
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';

/**
 * Updates timestamps for all news articles in the database using the new logic
 * This will set all articles to have sequential timestamps starting from now
 */
async function updateAllNewsTimestamps() {
  console.log('🔄 Starting to update all news timestamps...');
  
  try {
    // 1. Fetch all published news articles, newest first
    console.log('📥 Fetching all published news articles...');
    
    const allNews = await db
      .select({
        id: news.id,
        title: news.title,
        created_at: news.created_at,
        published_at: news.published_at,
        updated_at: news.updated_at
      })
      .from(news)
      .where(
        and(
          eq(news.status, 'published')
        )
      )
      .orderBy(desc(news.id)); // Order by ID descending to process newest first

    console.log(`📊 Found ${allNews.length} news articles to update`);

    if (allNews.length === 0) {
      console.log('ℹ️ No articles found to update');
      return;
    }

    // 2. Calculate base timestamp (current time)
    const baseTimestamp = Date.now();
    console.log(`🕒 Setting base timestamp to: ${new Date(baseTimestamp).toISOString()}`);

    // 3. Update each article with new sequential timestamps
    let updatedCount = 0;
    
    for (let i = 0; i < allNews.length; i++) {
      const newsItem = allNews[i];
      
      try {
        // Calculate new timestamps (1 minute apart, newest first)
        const minutesToSubtract = i; // Subtract more minutes for older articles
        const newTimestamp = new Date(baseTimestamp - (minutesToSubtract * 60 * 1000));
        
        // Update the article with the new timestamps
        await db
          .update(news)
          .set({
            created_at: newTimestamp,
            published_at: newTimestamp,
            updated_at: new Date() // Set updated_at to now
          })
          .where(eq(news.id, newsItem.id));
        
        updatedCount++;
        
        // Log progress every 10 updates
        if (updatedCount % 10 === 0) {
          console.log(`🔄 Updated ${updatedCount}/${allNews.length} articles`);
        }
      } catch (error) {
        console.error(`❌ Error updating article ${newsItem.id} (${newsItem.title}):`, error);
      }
    }

    console.log(`✅ Successfully updated timestamps for ${updatedCount} articles`);
    console.log(`📅 Articles now have timestamps from ${new Date(baseTimestamp - ((allNews.length - 1) * 60 * 1000)).toISOString()} to ${new Date(baseTimestamp).toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error updating news timestamps:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateAllNewsTimestamps();
