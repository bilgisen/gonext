import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';

// Istanbul timezone (UTC+3)
const ISTANBUL_TIMEZONE = 'Europe/Istanbul';

/**
 * Formats a date to a string in Istanbul timezone
 * @param date - Date to format (can be string or Date object)
 * @param format - Format string
 * @returns Formatted date string in Istanbul timezone
 */
function formatInIstanbul(date: Date | string, format: string): string {
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format in Istanbul timezone
  return formatInTimeZone(dateObj, ISTANBUL_TIMEZONE, format);
}

/**
 * Gets the current date in Istanbul timezone as a string in YYYY-MM-DD format
 * @returns Current date string in YYYY-MM-DD format
 */
export function getCurrentIstanbulDateString(): string {
  return formatInIstanbul(new Date(), 'yyyy-MM-dd');
}

/**
 * Formats a date to a human-readable string in English locale and Istanbul timezone
 * @param date - Date to format (can be string or Date object)
 * @returns Formatted date string in English
 */
export function formatEnglishDate(date: Date | string): string {
  // Ensure we have a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format in English locale and Istanbul timezone
  return formatInTimeZone(dateObj, ISTANBUL_TIMEZONE, 'MMMM d, yyyy \'at\' h:mm a', {
    locale: enUS
  }) + ' (UTC+3)';
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
  // Get current time in Istanbul timezone (UTC+3)
  const now = new Date();
  const istanbulOffset = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const nowIstanbul = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istanbulOffset);
  
  // If we have a previous date, convert it to Istanbul time
  let baseDate: Date;
  if (previousDate) {
    const prevDate = new Date(previousDate);
    baseDate = new Date(prevDate.getTime() + (prevDate.getTimezoneOffset() * 60000) + istanbulOffset);
  } else {
    // Default to 1 minute before now if no previous date
    baseDate = new Date(nowIstanbul.getTime() - 60000);
  }
  
  // Add 1 second to the base date for the next article
  const nextDate = new Date(Math.max(
    baseDate.getTime() + 1000, // Add 1 second
    nowIstanbul.getTime() - 300000 // But not more than 5 minutes in the past
  ));
  
  // For debugging: Log the generated dates
  console.log('Current Istanbul time:', nowIstanbul.toISOString());
  console.log('Next article timestamp:', nextDate.toISOString());
  
  // Return the dates in UTC+3
  return {
    created_at: nextDate,
    published_at: nextDate
  };
}

/**
 * @deprecated Use formatEnglishDate instead for consistency with the site's English language
 * Formats a date to a human-readable string in Turkish locale and Istanbul timezone
 * @param date - Date to format (can be string or Date object)
 * @returns Formatted date string in Turkish
 */
export function formatTurkishDate(date: Date | string): string {
  // For backward compatibility, but use formatEnglishDate for new code
  return formatEnglishDate(date);
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