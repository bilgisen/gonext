// Define valid categories as a const array for type safety
export const VALID_CATEGORIES = ['turkiye', 'business', 'world', 'culture', 'technology', 'sports'] as const;
export type Category = typeof VALID_CATEGORIES[number];

// Export CategoryMapping type for use in other files
export interface CategoryMapping {
  [key: string]: Category;
}

// Type guard to check if a string is a valid category
const isValidCategory = (category: string): category is Category => {
  return (VALID_CATEGORIES as readonly string[]).includes(category);
};

// Default category to use when no valid category is found
const DEFAULT_CATEGORY: Category = 'turkiye';

/**
 * Category mapping for extracting categories from URL paths
 * Example: https://www.dunya.com/sirketler/ -> "sirketler" -> "business"
 */
export const CATEGORY_MAPPINGS: CategoryMapping = {
  // Business & Finance
  'sirketler': 'business',
  'sektorler': 'business',
  'finans': 'business',
  'ekonomi': 'business',
  'sirket-haberleri': 'business',
  'spor-ekonomisi': 'business',
  'borsa': 'business',
  'piyasalar': 'business',
  'otomotiv': 'business',
  'altin': 'business',
  'faiz': 'business',
  'is-dunyasi': 'business',
  'sigorta': 'business',
  'emtia': 'business',
  'girisim': 'business',
  'veriler': 'business',
  'enerji': 'business',
  'gayrimenkul': 'business',
  'emlak': 'business',

  // Türkiye
  'politika': 'turkiye',
  'siyaset': 'turkiye',
  'haberler': 'turkiye',
  'gundem': 'turkiye',
  'sondakika': 'turkiye',
  'son-dakika': 'turkiye',
  'turkiye': 'turkiye',
  'haber': 'turkiye',

  // Technology
  'teknoloji': 'technology',
  'bilim': 'technology',

  // Sports
  'spor': 'sports',
  'sporskor': 'sports',

  // Culture and Arts
  'kultur': 'culture',
  'sanat': 'culture',
  'kultur-sanat': 'culture',
  'n-life': 'culture',
  
  // World News
  'dunya': 'world',
};

// Domain to category mapping for fallback
const DOMAIN_CATEGORY_MAPPINGS: Record<string, Category> = {
  'teknoloji': 'technology',
  'bilim': 'technology',
  'spor': 'sports',
  'gundem': 'turkiye',
  'haber': 'turkiye',
  'ekonomi': 'business',
  'finans': 'business',
};

/**
 * Extracts a valid category from a URL path segment
 */
const getCategoryFromSegment = (segment: string): Category | null => {
  const normalizedSegment = segment.toLowerCase().trim();
  const mappedCategory = CATEGORY_MAPPINGS[normalizedSegment];
  return mappedCategory && isValidCategory(mappedCategory) ? mappedCategory : null;
};

/**
 * Extracts a category from a hostname using domain keywords
 */
const getCategoryFromHostname = (hostname: string): Category | null => {
  const normalizedHostname = hostname.toLowerCase();
  
  for (const [keyword, category] of Object.entries(DOMAIN_CATEGORY_MAPPINGS)) {
    if (normalizedHostname.includes(keyword)) {
      return category;
    }
  }
  
  return null;
};

/**
 * Extract category from URL path
 * @param url - Original URL (e.g: https://www.dunya.com/sirketler/intel-haberi)
 * @returns Valid category string (defaults to 'turkiye' if no valid category found)
 */
export function extractCategoryFromUrl(url: string): Category {
  if (!url || typeof url !== 'string') {
    return DEFAULT_CATEGORY;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // First, try to find category in URL path segments
    const segments = pathname.split('/').filter(Boolean);
    for (const segment of segments) {
      const category = getCategoryFromSegment(segment);
      if (category) {
        return category;
      }
    }

    // If no category found in path, try domain-based matching
    const hostnameCategory = getCategoryFromHostname(urlObj.hostname);
    if (hostnameCategory) {
      return hostnameCategory;
    }

    return DEFAULT_CATEGORY;
  } catch (error) {
    console.warn('Failed to extract category from URL:', url, error);
    return DEFAULT_CATEGORY;
  }
}

/**
 * Extract category from multiple URLs and return the most popular one
 * @param urls - Array of URLs
 * @returns Most matching category (defaults to 'turkiye' if no valid URLs provided)
 */
export function extractCategoryFromUrls(urls: string[]): Category {
  if (!Array.isArray(urls) || urls.length === 0) {
    return DEFAULT_CATEGORY;
  }

  // Count category occurrences
  const categoryCount = urls.reduce<Record<Category, number>>((acc, url) => {
    const category = extractCategoryFromUrl(url);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<Category, number>);

  // Find the most frequent category
  const mostFrequent = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  return isValidCategory(mostFrequent) ? mostFrequent : DEFAULT_CATEGORY;
}

/**
 * Create a URL-friendly slug from a category name
 * @param category - Category name
 * @returns URL-friendly slug string
 */
export function createCategorySlug(category: string): string {
  if (!category || typeof category !== 'string') {
    return '';
  }
  
  return category
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}
