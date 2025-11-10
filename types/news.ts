// types/news.ts
// Centralized type definitions for the application

// Category related types and constants
export const VALID_CATEGORIES = ['turkiye', 'business', 'world', 'entertainment', 'technology', 'travel', 'sports'] as const;
export type Category = typeof VALID_CATEGORIES[number];
export type NewsCategory = Category; // For backward compatibility

export interface CategoryMapping {
  [key: string]: Category;
}

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
  'business': 'business',
  'finance': 'business',
  'markets': 'business',

  // Türkiye
  'politika': 'turkiye',
  'siyaset': 'turkiye',
  'haberler': 'turkiye',
  'gundem': 'turkiye',
  'sondakika': 'turkiye',
  'son-dakika': 'turkiye',
  'turkiye': 'turkiye',
  'türkiye': 'turkiye',
  'haber': 'turkiye',
  'gündem': 'turkiye',

  // Technology
  'teknoloji': 'technology',
  'bilim': 'technology',
  'technology': 'technology',
  'bilim-teknoloji': 'technology',

  // Sports
  'spor': 'sports',
  'sporskor': 'sports',
  'futbol': 'sports',
  'basketbol': 'sports',
  'voleybol': 'sports',
  'sports': 'sports',

  // Travel
  'gezi': 'travel',
  'seyahat': 'travel',
  'tatil': 'travel',
  'travel': 'travel',
  'turizm': 'travel',

  // Entertainment
  'kultur': 'entertainment',
  'sanat': 'entertainment',
  'kultur-sanat': 'entertainment',
  'eğlence': 'entertainment',
  'eglence': 'entertainment',
  'magazin': 'entertainment',
  'n-life': 'entertainment',
  'yasam': 'entertainment',
  'lifestyle': 'entertainment',
  'life': 'entertainment',
  'kültür': 'entertainment',
  'yaşam': 'entertainment',
  'entertainment': 'entertainment',
  'culture': 'entertainment',
  'kültür-sanat': 'entertainment',
  
  // World News
  'dunya': 'world',
  'world': 'world',
  'dünya': 'world',
  'ulke': 'world',
  'ulkeler': 'world',
  'ülke': 'world',
  'ülkeler': 'world',
  'avrupa': 'world',
  'amerika': 'world',
  'asya': 'world',
  'afrika': 'world',
  'europe': 'world',
  'americas': 'world',
  'asia': 'world',
  'africa': 'world'
};

// Default category to use when no valid category is found
export const DEFAULT_CATEGORY: Category = 'turkiye';

// ====================================
// 1. Core Types
// ====================================


// ====================================
// 2. API Response Types (Zod Schemas)
// ====================================

import { z } from 'zod';

export const NewsApiItemSchema = z.object({
  id: z.string(),
  source_guid: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  tldr: z.array(z.string()),
  content_md: z.string(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  image: z.string().url(),
  image_title: z.string(),
  image_desc: z.string().optional(),
  original_url: z.string().url(),
  file_path: z.string(),
  created_at: z.string(),
  published_at: z.string(),
  updated_at: z.string(),
  slug: z.string(),
  read_time: z.number().optional(),
  is_bookmarked: z.boolean().optional(),
});

export type NewsApiItem = z.infer<typeof NewsApiItemSchema>;

export const NewsApiResponseSchema = z.object({
  items: z.array(NewsApiItemSchema),
  page: z.number().optional(),
  page_size: z.number().optional(),
  total: z.number().optional(),
});

export type NewsApiResponse = z.infer<typeof NewsApiResponseSchema>;

// ====================================
// 3. News Item Types
// ====================================

export interface NewsItem {
  id: string;
  source_id: string;
  source_guid: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_html?: string; // Pre-rendered HTML content
  seo_title: string;
  seo_description: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  view_count: number;
  read_time: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  image_url: string;
  image_alt: string;
  image_caption: string;
  author_id: number | null;
  source_url: string | null;
  categories: NewsCategory[];
  tags: string[];
  meta: Record<string, any>;
  // For backward compatibility
  image: string;
  category: NewsCategory;
  // Add other properties as needed
  [key: string]: any; // For any additional dynamic properties
}

export interface CategoryEntity {
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

// ====================================
// 4. API Response Wrappers
// ====================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}

// ====================================
// 5. Filter and Sort Types
// ====================================

export interface BaseFilters {
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NewsFilters extends BaseFilters {
  category?: string | string[];
  categories?: string[];
  tag?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular';
  type?: 'category' | 'tag' | 'search' | 'featured';
  excludeId?: string;
  offset?: number;
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface SearchFilters extends BaseFilters {
  category?: string;
  tag?: string;
  query?: string;
}

export interface BookmarkFilters extends BaseFilters {
  sortBy?: 'date' | 'title';
}

// ====================================
// 6. Error Types
// ====================================

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export class NewsFetchError extends ApiError {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message, 'NEWS_FETCH_ERROR', 500);
    this.name = 'NewsFetchError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends ApiError {
  constructor(message: string, public duplicateField: string) {
    super(message, 'DUPLICATE_ERROR', 409);
    this.name = 'DuplicateError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

// ====================================
// 7. Utility Types
// ====================================

export interface SlugOptions {
  maxLength?: number;
  separator?: string;
  lowercase?: boolean;
}

// ====================================
// 8. User and Authentication Types
// ====================================

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  reading_time_goal: number;
  favorite_categories: NewsCategory[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

// ====================================
// 9. News List and Infinite Scroll Types
// ====================================

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  offset: number;
}

/**
 * Type for TanStack Query's useInfiniteQuery data structure
 */
export interface NewsInfiniteData {
  pages: NewsListResponse[];
  pageParams: (number | null)[];
}

// ====================================
// 10. Search and Suggestion Types
// ====================================

export interface SearchSuggestion {
  query: string;
  count: number;
  category?: string;
}

// ====================================
// 11. Local Database Types
// ====================================

export interface Bookmark {
  id: string;
  user_id: string;
  news_id: string;
  news_data: NewsItem;
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

// ====================================
// 12. Utility Functions
// ====================================

// Note: Category-related utility functions have been moved to @/lib/utils/string-utils.ts
