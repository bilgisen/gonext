// scripts/fix-article-timestamps.ts
import { db } from '../db/client';
import { news } from '../db/schema';
import { asc, desc, eq } from 'drizzle-orm';

async function fixArticleTimestamps() {
  try {
    console.log('🔄 Fetching all articles...');
    
    // Fetch all articles ordered by their current created_at date
    const allArticles = await db
      .select({
        id: news.id,
        title: news.title,
        created_at: news.created_at,
        published_at: news.published_at,
      })
      .from(news)
      .orderBy(asc(news.created_at));

    if (allArticles.length === 0) {
      console.log('ℹ️ No articles found in the database');
      return;
    }

    console.log(`📝 Found ${allArticles.length} articles to update`);
    
    // Start from the current time and go backwards
    let currentDate = new Date();
    
    // Process articles in reverse order to assign the most recent dates to the most recent articles
    for (let i = allArticles.length - 1; i >= 0; i--) {
      const article = allArticles[i];
      
      // Update the article with new timestamps
      await db
        .update(news)
        .set({
          created_at: currentDate,
          published_at: new Date(currentDate.getTime() + 60000), // 1 minute after created
          updated_at: new Date()
        })
        .where(eq(news.id, article.id));
      
      // Move back 1 minute for the next article
      currentDate = new Date(currentDate.getTime() - 60000);
      
      // Log progress
      if (i % 10 === 0 || i === allArticles.length - 1) {
        console.log(`✅ Updated ${allArticles.length - i}/${allArticles.length} articles`);
      }
    }
    
    console.log('✨ Successfully updated all article timestamps');
    
  } catch (error) {
    console.error('❌ Error fixing article timestamps:', error);
    process.exit(1);
  }
}

// Run the function
fixArticleTimestamps();
