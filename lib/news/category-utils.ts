import type { CategoryMapping } from './types';

/**
 * Category mapping for extracting categories from URL paths
 * Example: https://www.dunya.com/sirketler/ -> "sirketler" -> "Business"
 */
export const CATEGORY_MAPPINGS: CategoryMapping = {
  // Business & Finance
  'sirketler': 'Business',
  'sektorler': 'Business',
  'finans': 'Business',
  'ekonomi': 'Business',
  'sirket-haberleri': 'Business',
  'spor-ekonomisi': 'Business',
  'borsa': 'Business',
  'piyasalar': 'Business',
  'otomotiv': 'Business',
  'altin': 'Business',
  'faiz': 'Business',
  'is-dunyasi': 'Business',
  'sigorta': 'Business',
  'emtia': 'Business',
  'girisim': 'Business',
  'veriler': 'Business',
  'enerji': 'Business',
  'gayrimenkul': 'Business',
  'emlak': 'Business',


  // Politics
  'politika': 'Politics',
  'politics': 'Politics',
  'political': 'Politics',
  'government': 'Politics',
  'siyaset': 'Politics',
  'parliament': 'Politics',
  'election': 'Politics',
  'elections': 'Politics',
  'secim': 'Politics',

  // Technology
  'teknoloji': 'Technology',
  'technology': 'Technology',
  'tech': 'Technology',
  'innovation': 'Technology',
  'digital': 'Technology',
  'software': 'Technology',
  'hardware': 'Technology',
  'ai': 'Technology',
  'artificial-intelligence': 'Technology',
  'yapay-zeka': 'Technology',
  'bilisim': 'Technology',
  'computer': 'Technology',
  'programming': 'Technology',
  'code': 'Technology',

  // Sports
  'spor': 'Sports',
  'sports': 'Sports',
  'football': 'Sports',
  'futbol': 'Sports',
  'basketball': 'Sports',
  'basketbol': 'Sports',
  'tennis': 'Sports',
  'tenis': 'Sports',
  'volleyball': 'Sports',
  'voleybol': 'Sports',
  'formula1': 'Sports',
  'formula-1': 'Sports',
  'f1': 'Sports',
  'motor-sports': 'Sports',
  'motorsporlari': 'Sports',

  // Health
  'saglik': 'Health',
  'health': 'Health',
  'medical': 'Health',
  'medicine': 'Health',
  'tip': 'Health',
  'hospital': 'Health',
  'hastane': 'Health',
  'doctor': 'Health',
  'doktor': 'Health',
  'pharma': 'Health',
  'ilac': 'Health',

  // Science
  'bilim': 'Science',
  'science': 'Science',
  'research': 'Science',
  'arastirma': 'Science',
  'discovery': 'Science',
  'kesif': 'Science',
  'space': 'Science',
  'uzay': 'Science',
  'astronomy': 'Science',
  'gokbilim': 'Science',

  // Entertainment
  'magazin': 'Entertainment',
  'entertainment': 'Entertainment',
  'celebrity': 'Entertainment',
  'music': 'Entertainment',
  'muzik': 'Entertainment',
  'movie': 'Entertainment',
  'movies': 'Entertainment',
  'film': 'Entertainment',
  'sinema': 'Entertainment',
  'tv': 'Entertainment',
  'television': 'Entertainment',

  // World News
  'dunya': 'World',
  'world': 'World',
  'international': 'World',
  'global': 'World',
  'haberler': 'World',
  'news': 'World',
  'gundem': 'World',
  'current': 'World',

  // Travel
  'seyahat': 'Travel',
  'travel': 'Travel',
  'tourism': 'Travel',
  'turizm': 'Travel',
  'vacation': 'Travel',
  'tatil': 'Travel',
  'hotel': 'Travel',
  'oteller': 'Travel',

  // Education
  'egitim': 'Education',
  'education': 'Education',
  'school': 'Education',
  'okul': 'Education',
  'university': 'Education',
  'universite': 'Education',
  'student': 'Education',
  'ogrenci': 'Education',

  // Environment
  'cevre': 'Environment',
  'environment': 'Environment',
  'climate': 'Environment',
  'iklim': 'Environment',
  'nature': 'Environment',
  'dogal': 'Environment',
  'green': 'Environment',
  'yesil': 'Environment',
  'sustainability': 'Environment',
  'surdurulebilirlik': 'Environment',

  // Lifestyle
  'yasam': 'Lifestyle',
  'lifestyle': 'Lifestyle',
  'fashion': 'Lifestyle',
  'moda': 'Lifestyle',
  'food': 'Lifestyle',
  'yemek': 'Lifestyle',
  'cooking': 'Lifestyle',
  'mutfak': 'Lifestyle',
  'home': 'Lifestyle',
  'ev': 'Lifestyle',
  'garden': 'Lifestyle',
  'bahce': 'Lifestyle',
};

/**
 * Extract category from URL path
 * @param url - Original URL (e.g: https://www.dunya.com/sirketler/intel-haberi)
 * @returns Category string or 'General' fallback
 */
export function extractCategoryFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Get path segments (e.g: ['', 'sirketler', 'intel-haberi'])
    const segments = pathname.split('/').filter(Boolean);

    // Look for category in each segment
    for (const segment of segments) {
      const category = CATEGORY_MAPPINGS[segment.toLowerCase()];
      if (category) {
        return category;
      }
    }

    // Extract from domain (fallback)
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('tech') || hostname.includes('teknoloji')) return 'Technology';
    if (hostname.includes('sport') || hostname.includes('spor')) return 'Sports';
    if (hostname.includes('health') || hostname.includes('saglik')) return 'Health';
    if (hostname.includes('finance') || hostname.includes('ekonomi')) return 'Business';

    return 'General';
  } catch (error) {
    console.warn('Failed to extract category from URL:', url, error);
    return 'General';
  }
}

/**
 * Extract category from multiple URLs and return the most popular one
 * @param urls - Array of URLs
 * @returns Most matching category
 */
export function extractCategoryFromUrls(urls: string[]): string {
  const categories = urls.map(extractCategoryFromUrl);

  // Count most frequent category
  const categoryCount = categories.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'General';
}

/**
 * Create category slug for URL
 * @param category - Category name
 * @returns URL-friendly slug
 */
export function createCategorySlug(category: string): string {
  return category.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}
