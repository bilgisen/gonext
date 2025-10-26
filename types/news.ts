// External API Response Types
export interface NewsItem {
  id: string;
  source_guid: string;
  source_id: string;
  seo_title: string;
  seo_description: string;
  tldr: string[];
  content_md: string;
  category: string;
  tags: string[];
  image: string;
  image_title: string;
  image_desc: string;
  original_url: string;
  file_path: string;
  created_at: string;
  published_at: string;
  updated_at: string;
  slug?: string;
  read_time?: number;
  is_bookmarked?: boolean;
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  news_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  news_count?: number;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  category?: string;
}

// Category mapping types (from lib/news/category-utils.ts)
export type CategoryMapping = {
  [key: string]: string;
};

// Category mapping for URL path extraction
export const CATEGORY_MAPPINGS: CategoryMapping = {
  // Business & Finance
  'sirketler': 'Business',
  'company': 'Business',
  'companies': 'Business',
  'business': 'Business',
  'finance': 'Business',
  'financial': 'Business',
  'ekonomi': 'Business',
  'economy': 'Business',
  'market': 'Business',
  'markets': 'Business',
  'stock': 'Business',
  'stocks': 'Business',
  'borsa': 'Business',
  'investment': 'Business',
  'investing': 'Business',

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

// Category utility functions
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

export function createCategorySlug(category: string): string {
  return category.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Local Database Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  reading_time_goal: number;
  favorite_categories: string[];
}

export interface Bookmark {
  id: string;
  user_id: string;
  news_id: string;
  news_data: NewsItem; // Denormalized for offline access
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  category?: string;
  results_count: number;
  created_at: string;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  news_id: string;
  read_time_seconds: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// Filter and Sort Types
export interface NewsFilters {
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'relevance';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  excludeId?: string; // Added to exclude specific news item from results
}

export interface SearchFilters {
  category?: string;
  tag?: string;
  limit?: number;
  page?: number;
}

export interface BookmarkFilters {
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title';
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}
