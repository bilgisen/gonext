// lib/news/types.ts
// Type definitions for the news module

import { NewsItem as SharedNewsItem, NewsCategory } from '@/types/news';

// Re-export types from the centralized types file
export type { NewsCategory };

// Extended types specific to the news module
export interface NewsApiItem extends Omit<SharedNewsItem, 'id' | 'created_at' | 'updated_at' | 'slug' | 'read_time' | 'is_bookmarked'> {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  read_time?: number;
  is_bookmarked?: boolean;
  status?: 'draft' | 'published' | 'archived';
  categories?: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
  image_url?: string;
  image_alt?: string;
  image_caption?: string;
  author?: {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  source?: {
    id: number;
    name: string;
    base_url: string;
  };
  meta?: Record<string, any>;
}

export interface NewsApiResponse {
  items: NewsApiItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface NewsApiOptions {
  // Pagination
  limit?: number;
  offset?: number;
  page?: number;
  
  // Filtering
  category?: string | string[];
  tag?: string | string[];
  status?: 'draft' | 'published' | 'archived' | 'all';
  featured?: boolean;
  
  // Search
  search?: string;
  searchFields?: string[];
  
  // Sorting
  sortBy?: 'published_at' | 'created_at' | 'updated_at' | 'title' | 'view_count';
  sortOrder?: 'asc' | 'desc';
  
  // Relations
  include?: string[];
  
  // Custom filters
  [key: string]: any;
}

export interface NewsInsertData {
  // Required fields
  title: string;
  source_guid: string;
  slug: string;
  
  // Optional fields with defaults
  source_id?: string | number;
  seo_title?: string;
  seo_description?: string;
  excerpt?: string;
  content_md?: string;
  content_html?: string;
  tldr?: string[];
  
  // Category and tags
  category?: NewsCategory;
  categories?: Array<string | number | { id: number; name: string; slug: string }>;
  tags?: Array<string | number | { id: number; name: string; slug: string }>;
  
  // Media
  image_url?: string;
  image_alt?: string;
  image_caption?: string;
  main_media_id?: number;
  
  // URLs
  original_url?: string;
  canonical_url?: string;
  
  // Status
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
  
  // Metadata
  meta?: Record<string, any>;
  
  // Timestamps
  created_at?: Date | string;
  updated_at?: Date | string | null;
  published_at?: Date | string | null;
  
  // Metrics
  word_count?: number;
  read_time?: number;
  reading_time_min?: number;
  tldr_count?: number;
  view_count?: number;
  
  // Relations
  source_fk?: number;
  editor_id?: number;
  author_id?: number;
}

export class NewsFetchError extends Error {
  constructor(
    message: string,
    public code: string = 'NEWS_FETCH_ERROR',
    public cause?: Error,
    public data?: any
  ) {
    super(message);
    this.name = 'NewsFetchError';
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NewsFetchError);
    }
  }
}

export class ValidationError extends NewsFetchError {
  constructor(
    message: string, 
    public field?: string,
    public validationErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ImageUploadResult {
  url: string;
  path: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    mimeType: string;
    filename: string;
  };
}

// Type guards
export function isNewsApiItem(item: any): item is NewsApiItem {
  return (
    typeof item === 'object' && 
    item !== null &&
    'title' in item &&
    'source_guid' in item
  );
}

export function isNewsApiResponse(response: any): response is NewsApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'items' in response &&
    Array.isArray(response.items)
  );
}
