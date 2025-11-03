/**
 * Generates sequential timestamps for news articles
 * Ensures each article gets a unique, sequential timestamp
 * 
 * @param previousDate Optional previous date to base the next timestamp on
 * @returns Object containing created_at and published_at dates
 */
export function generateNewsTimestamps(previousDate?: Date): {
  created_at: Date;
  published_at: Date;
} {
  const now = new Date();
  
  // If we have a previous date, use it as the base, otherwise use current time
  const baseDate = previousDate ? new Date(previousDate) : now;
  
  // Add 1 minute to the base date for the next article
  const nextDate = new Date(baseDate.getTime() + 60000);
  
  // Create dates with 1 minute intervals for created_at and published_at
  const createdDate = new Date(nextDate);
  const publishedDate = new Date(nextDate.getTime() + 60000); // 1 minute after created
  
  return {
    created_at: createdDate,
    published_at: publishedDate
  };
}

/**
 * Generates timestamps for a new article using the latest article's date
 * @param latestArticleDate Optional date of the latest article to ensure sequential ordering
 */
export async function generateTimestampsForNewArticle(latestArticleDate?: Date) {
  // If we don't have a latest article date, use current time
  if (!latestArticleDate) {
    return generateNewsTimestamps();
  }
  
  // Generate timestamps based on the latest article's date
  return generateNewsTimestamps(latestArticleDate);
}

/**
 * Updates timestamps for all articles to ensure they're sequential
 * This should be run after importing articles to fix any timestamp issues
 */
export async function fixArticleTimestamps() {
  // This function would need to be implemented based on your database
  // It should fetch all articles, sort them by created_at, and update their timestamps sequentially
  console.warn('fixArticleTimestamps() needs to be implemented with database access');
}