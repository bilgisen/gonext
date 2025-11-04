import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// Istanbul timezone (UTC+3)
const ISTANBUL_TIMEZONE = 'Europe/Istanbul';

/**
 * Gets the current time in Istanbul timezone
 * @returns Current date in Istanbul timezone
 */
function getCurrentIstanbulTime(): Date {
  return toZonedTime(new Date(), ISTANBUL_TIMEZONE);
}

/**
 * Formats a date to a string in Istanbul timezone
 * @param date - Date to format
 * @param format - Format string
 * @returns Formatted date string
 */
function formatInIstanbul(date: Date, format: string): string {
  return formatInTimeZone(date, ISTANBUL_TIMEZONE, format);
}

/**
 * Generates sequential timestamps for news articles in Istanbul timezone
 * Ensures each article gets a unique, sequential timestamp
 * 
 * @param previousDate Optional previous date to base the next timestamp on
 * @returns Object containing created_at and published_at dates in Istanbul timezone
 */
export function generateNewsTimestamps(previousDate?: Date): {
  created_at: Date;
  published_at: Date;
} {
  const now = getCurrentIstanbulTime();
  
  // If we have a previous date that's in the future, use current time instead
  const baseDate = (previousDate && previousDate <= now) ? 
    new Date(previousDate) : 
    new Date(now.getTime() - 60000); // 1 minute before now
  
  // Add 1 second to the base date for the next article
  const nextDate = new Date(Math.max(
    baseDate.getTime() + 1000, // Add 1 second
    now.getTime() - 300000     // But not more than 5 minutes in the past
  ));
  
  // Ensure the date is in Istanbul timezone
  const istanbulDate = toZonedTime(nextDate, ISTANBUL_TIMEZONE);
  
  // For debugging: Log the generated dates
  console.log('Generated date in Istanbul timezone:', 
    formatInIstanbul(istanbulDate, 'yyyy-MM-dd HH:mm:ssXXX'));
  
  return {
    created_at: istanbulDate,
    published_at: istanbulDate
  };
}

/**
 * Formats a date to a human-readable string in Turkish locale and Istanbul timezone
 * @param date - Date to format
 * @returns Formatted date string in Turkish
 */
export function formatTurkishDate(date: Date): string {
  return formatInTimeZone(date, ISTANBUL_TIMEZONE, 'MMMM d, yyyy h:mm a', {
    // No locale specified, will use English by default
  }) + ' (UTC+3)';
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