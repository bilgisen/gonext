// types/news.ts
// Centralized type definitions for the application

// Import types from category-utils first to avoid circular dependencies
import { 
  Category as NewsCategory, 
  CATEGORY_MAPPINGS,
  extractCategoryFromUrl as extractCategoryFromUrlUtil,
  VALID_CATEGORIES,
  type CategoryMapping
} from '@/lib/news/category-utils';

// Re-export types and values with proper type exports
export type { NewsCategory, CategoryMapping };
export { CATEGORY_MAPPINGS, VALID_CATEGORIES, extractCategoryFromUrlUtil };

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

export interface NewsItem extends Omit<NewsApiItem, 'category' | 'categories'> {
  id: string;
  title?: string;
  category: NewsCategory;
  categories: NewsCategory[];
  source_id: string;
  source_guid: string;
  seo_title: string;
  seo_description: string;
  image: string;
  slug: string;
  read_time: number;
  created_at: string;
  updated_at: string;
  published_at: string;
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
}

export interface NewsFilters extends BaseFilters {
  category?: string | string[];
  categories?: string[];
  tag?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular';
  type?: 'category' | 'tag' | 'search' | 'featured';
  excludeId?: string;
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

/**
 * Extract the most common category from multiple URLs
 * @param urls - Array of URLs to analyze
 * @returns The most common category, or 'turkiye' if none found
 */
export function extractCategoryFromUrls(urls: string[]): NewsCategory {
  const categoryCounts = new Map<NewsCategory, number>();
  
  urls.forEach(url => {
    const category = extractCategoryFromUrlUtil(url);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });
  
  let mostCommonCategory: NewsCategory = 'turkiye';
  let highestCount = 0;
  
  categoryCounts.forEach((count, category) => {
    if (count > highestCount) {
      highestCount = count;
      mostCommonCategory = category;
    }
  });
  
  return mostCommonCategory;
}

/**
 * @deprecated Use the version from category-utils instead
 */
export function createCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Re-export the extractCategoryFromUrl function for backward compatibility
export { extractCategoryFromUrlUtil as extractCategoryFromUrl };
