/**
 * Date utility functions for news articles
 */

/**
 * Generates a random number between min and max (inclusive)
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formats a date to ISO string with timezone offset
 */
function formatDateWithOffset(date: Date): string {
  const tzOffset = -date.getTimezoneOffset();
  const offsetSign = tzOffset >= 0 ? '+' : '-';
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const offsetHours = Math.floor(Math.abs(tzOffset) / 60);
  const offsetMinutes = Math.abs(tzOffset) % 60;
  const offsetString = `${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
  
  // Format as ISO string and replace the Z with our timezone offset
  return date.toISOString().replace('Z', offsetString);
}

/**
 * Generates timestamps for a news article based on the current time
 * @returns Object containing created_at and published_at timestamps
 */
export function generateNewsTimestamps(): {
  created_at: string;
  published_at: string;
} {
  const now = new Date();
  
  // Generate a random number of minutes between 3 and 15 for created_at
  const randomMinutesAgo = getRandomInt(3, 15);
  const createdDate = new Date(now.getTime() - randomMinutesAgo * 60 * 1000);
  
  // published_at is 2 minutes after created_at
  const publishedDate = new Date(createdDate.getTime() + 2 * 60 * 1000);
  
  return {
    created_at: formatDateWithOffset(createdDate),
    published_at: formatDateWithOffset(publishedDate)
  };
}

/**
 * Updates the timestamps of news items to use our generated dates
 */
export function updateNewsTimestamps<T extends { created_at?: string | Date | null; published_at?: string | Date | null }>(
  newsItem: T
): T {
  const timestamps = generateNewsTimestamps();
  
  return {
    ...newsItem,
    created_at: timestamps.created_at,
    published_at: timestamps.published_at,
    updated_at: timestamps.published_at // Set updated_at to match published_at
  };
}
