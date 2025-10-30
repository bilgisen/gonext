// Define valid categories as a const array for type safety
export const VALID_CATEGORIES = ['turkiye', 'business', 'world', 'culture', 'technology', 'travel', 'sports'] as const;
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

// Common URL patterns that indicate business/economy content
const BUSINESS_PATTERNS = ['ekonomi', 'finans', 'borsa', 'piyasalar', 'sermaye', 'yatirim', 'business', 'finance', 'markets'];
const TURKIYE_PATTERNS = ['gundem', 'siyaset', 'politika', 'turkiye', 'haberler', 'son-dakika'];
const TECHNOLOGY_PATTERNS = ['teknoloji', 'bilim', 'teknoloji-haberleri', 'teknoloji-haberler', 'bilim-teknoloji'];
const SPORTS_PATTERNS = ['spor', 'futbol', 'basketbol', 'voleybol', 'spor-haberleri'];
const TRAVEL_PATTERNS = ['seyahat', 'gezi', 'tatil', 'travel', 'turizm'];
const CULTURE_PATTERNS = ['kultur', 'sanat', 'kultur-sanat', 'yasam', 'lifestyle', 'life'];
const WORLD_PATTERNS = ['dunya', 'world', 'ulke', 'ulkeler', 'avrupa', 'amerika', 'asya', 'afrika'];

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

    // Travel
  'gezi': 'travel',


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
  if (!segment) return null;
  
  const normalizedSegment = segment.toLowerCase().trim();
  
  // First try exact match
  if (CATEGORY_MAPPINGS[normalizedSegment]) {
    return CATEGORY_MAPPINGS[normalizedSegment] as Category;
  }
  
  // Check for common patterns in the segment
  const segmentLower = normalizedSegment.toLowerCase();
  
  // Check for business/economy related patterns
  if (BUSINESS_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'business';
  }
  
  // Check for Turkey related patterns
  if (TURKIYE_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'turkiye';
  }
  
  // Check for technology related patterns
  if (TECHNOLOGY_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'technology';
  }
  
  // Check for sports related patterns
  if (SPORTS_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'sports';
  }
  
  // Check for travel related patterns
  if (TRAVEL_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'travel';
  }
  
  // Check for culture related patterns
  if (CULTURE_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'culture';
  }
  
  // Check for world news patterns
  if (WORLD_PATTERNS.some(pattern => segmentLower.includes(pattern))) {
    return 'world';
  }
  
  // Then check if any key in CATEGORY_MAPPINGS is included in the segment
  for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
    if (normalizedSegment.includes(key)) {
      return value as Category;
    }
  }
  
  return null;
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
    const { pathname, hostname } = urlObj;
    
    // First, try to find category in URL path segments
    const segments = pathname.split('/').filter(Boolean);
    
    // Check each segment for category indicators
    for (const segment of segments) {
      const category = getCategoryFromSegment(segment);
      if (category) {
        return category;
      }
    }
    
    // Check the entire path as a last resort
    const pathCategory = getCategoryFromSegment(pathname);
    if (pathCategory) {
      return pathCategory;
    }

    // If no category found in path, try domain-based matching
    const hostnameCategory = getCategoryFromHostname(hostname);
    if (hostnameCategory) {
      return hostnameCategory;
    }
    
    // Check for common domain patterns
    if (hostname.includes('ekonomi') || hostname.includes('finans') || hostname.includes('borsa')) {
      return 'business';
    }
    
    if (hostname.includes('teknoloji') || hostname.includes('teknohaber')) {
      return 'technology';
    }
    
    if (hostname.includes('spor') || hostname.includes('sporkolik') || hostname.includes('futbol')) {
      return 'sports';
    }

    // If we still don't have a category, try to infer from URL structure
    if (url.includes('/ekonomi/') || url.includes('/business/') || url.includes('/finans/')) {
      return 'business';
    }
    
    if (url.includes('/teknoloji/') || url.includes('/technology/') || url.includes('/bilim/')) {
      return 'technology';
    }
    
    if (url.includes('/spor/') || url.includes('/sports/') || url.includes('/futbol/')) {
      return 'sports';
    }
    
    if (url.includes('/dunya/') || url.includes('/world/') || url.includes('/ulke/')) {
      return 'world';
    }
    
    if (url.includes('/kultur/') || url.includes('/sanat/') || url.includes('/culture/')) {
      return 'culture';
    }
    
    if (url.includes('/seyahat/') || url.includes('/gezi/') || url.includes('/travel/')) {
      return 'travel';
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
 * @param title - News title (optional)
 * @returns Most matching category (defaults to 'turkiye' if no valid URLs provided)
 */
export function extractCategoryFromUrls(urls: string[]): Category {
  if (!Array.isArray(urls) || urls.length === 0) {
    return DEFAULT_CATEGORY;
  }

  const categoryCounts = new Map<Category, number>();
  
  for (const url of urls) {
    const category = extractCategoryFromUrl(url);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  // Find the most frequent category
  let mostFrequent: Category = DEFAULT_CATEGORY;
  let maxCount = 0;
  
  for (const [category, count] of categoryCounts.entries()) {
    if (count > maxCount) {
      mostFrequent = category;
      maxCount = count;
    }
  }

  return isValidCategory(mostFrequent) ? mostFrequent : DEFAULT_CATEGORY;
}

/**
 * Create a URL-friendly slug from a category name
 * @param category - Category name
 * @returns URL-friendly slug string
 */
export function createCategorySlug(category: string): string {
  if (!category || typeof category !== 'string') {
    return DEFAULT_CATEGORY;
  }

  // First, try to find a direct match in our mappings
  const normalizedCategory = category.toLowerCase().trim();
  
  // Check for direct match in mappings
  if (CATEGORY_MAPPINGS[normalizedCategory]) {
    return CATEGORY_MAPPINGS[normalizedCategory];
  }

  // Check for partial matches (e.g., 'ekonomi' in 'ekonomi/haber')
  const matchingKey = Object.keys(CATEGORY_MAPPINGS).find(key => 
    normalizedCategory.includes(key)
  );
  
  if (matchingKey) {
    return CATEGORY_MAPPINGS[matchingKey];
  }

  // Convert Turkish characters to their ASCII equivalents
  const turkishToAscii: Record<string, string> = {
    'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
    'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c'
  };

  // Create a slug from the category name
  const slug = normalizedCategory
    .split('')
    .map(char => turkishToAscii[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();

  // If the resulting slug is empty or not a valid category, use default
  if (!slug || !VALID_CATEGORIES.includes(slug as Category)) {
    return DEFAULT_CATEGORY;
  }

  return slug;
}
