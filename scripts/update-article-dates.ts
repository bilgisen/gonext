// scripts/update-article-dates.ts
import { db } from '@/db/client';
import { news } from '@/db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';

async function updateArticleDates() {
  try {
    console.log('Updating article dates...');
    
    // Get all published, public articles with old dates
    const oldDate = new Date('2025-11-01T00:00:00.000Z');
    
    const articlesToUpdate = await db
      .select()
      .from(news)
      .where(
        and(
          eq(news.status, 'published'),
          eq(news.visibility, 'public'),
          isNotNull(news.published_at)
        )
      )
      .limit(50); // Update in batches of 50
    
    console.log(`Found ${articlesToUpdate.length} articles to update`);
    
    if (articlesToUpdate.length === 0) {
      console.log('No articles need updating.');
      return;
    }
    
    // Update each article with a recent date
    const now = new Date();
    let hoursAgo = articlesToUpdate.length;
    
    for (const article of articlesToUpdate) {
      const newDate = new Date(now);
      newDate.setHours(now.getHours() - hoursAgo);
      hoursAgo--;
      
      await db
        .update(news)
        .set({ 
          published_at: newDate,
          updated_at: now 
        })
        .where(eq(news.id, article.id));
      
      console.log(`Updated article ${article.id}: ${article.title}`);
      console.log(`  Old date: ${article.published_at}`);
      console.log(`  New date: ${newDate}\n`);
    }
    
    console.log('Successfully updated article dates!');
    
  } catch (error) {
    console.error('Error updating article dates:', error);
  } finally {
    process.exit(0);
  }
}

updateArticleDates();
