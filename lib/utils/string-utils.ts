/**
 * String utility functions
 */

/**
 * Normalizes Turkish characters in strings
 */
const normalizeTurkishChars = (str: string): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[ı]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[âîû]/g, (match) => ({
      'â': 'a',
      'î': 'i',
      'û': 'u'
    }[match] || match));
};

/**
 * Creates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug string
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  // First normalize Turkish characters
  const normalized = normalizeTurkishChars(text);
  
  // Convert to lowercase and replace spaces with hyphens
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
    .replace(/^-+|-+$/g, '')     // Trim - from start and end
    .replace(/-+/g, '-');        // Replace multiple - with single -
}

/**
 * Creates a category slug from a category name
 * @deprecated Use createSlug instead
 */
export const createCategorySlug = createSlug;
