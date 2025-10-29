import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Parses a date string from the API into a Date object
 * Handles different date formats that might come from the API
 * Returns current date if parsing fails
 */
export function parseNewsDate(dateString?: string | Date | null): Date {
  // If no date string provided, return current date
  if (!dateString) return new Date();
  
  // If already a Date object, return it
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? new Date() : dateString;
  }
  
  try {
    // Try parsing as ISO string first
    if (dateString.includes('T')) {
      const date = parseISO(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Try parsing as timestamp (milliseconds since epoch)
    const timestamp = parseInt(dateString, 10);
    if (!isNaN(timestamp)) {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Try parsing as YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(`${dateString}T00:00:00.000Z`);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Try parsing with the format used in the API
    const parts = dateString.split(/[- :/]/);
    if (parts.length >= 3) {
      // Assuming format: YYYY-MM-DD HH:MM:SS or DD/MM/YYYY HH:MM:SS
      let year, month, day, hours = '00', minutes = '00', seconds = '00';
      
      if (dateString.includes('/')) {
        // DD/MM/YYYY format
        [day, month, year, hours = '00', minutes = '00', seconds = '00'] = parts;
      } else {
        // YYYY-MM-DD format
        [year, month, day, hours = '00', minutes = '00', seconds = '00'] = parts;
      }
      
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Months are 0-indexed in JS
        parseInt(day, 10),
        parseInt(hours, 10) || 0,
        parseInt(minutes, 10) || 0,
        parseInt(seconds, 10) || 0
      );
      
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Fallback to default Date parsing
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    
  } catch (error) {
    console.error(`Error parsing date '${dateString}':`, error);
    return new Date();
  }
}

/**
 * Formats a date for display in the UI
 */
export function formatNewsDate(date: Date | string | null | undefined, formatStr: string = 'dd MMMM yyyy'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseNewsDate(date) : date;
  if (!dateObj) return '';
  
  return format(dateObj, formatStr, { locale: tr });
}

/**
 * Formats a date for database storage
 */
export function formatDateForDb(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? parseNewsDate(date) : date;
  if (!dateObj) return null;
  
  return dateObj.toISOString();
}
