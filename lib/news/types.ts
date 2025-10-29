// lib/news/types.ts
// Local type definitions for the news module

import { NewsItem as SharedNewsItem, NewsCategory } from '@/types/news';

// Re-export types from the centralized types file
export type { NewsCategory };

// Extended types specific to the news module
export interface NewsApiItem extends Omit<SharedNewsItem, 'id' | 'created_at' | 'updated_at' | 'slug' | 'read_time' | 'is_bookmarked'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  read_time?: number;
  is_bookmarked?: boolean;
}

export interface NewsInsertData {
  // Required fields
  title: string;
  source_guid: string;
  slug: string;
  
  // Optional fields with defaults
  source_id?: string;
  seo_title?: string;
  seo_description?: string;
  excerpt?: string;
  content_md?: string;
  content_html?: string;
  tldr?: string[];
  
  // Category and tags
  category?: NewsCategory;
  categories?: NewsCategory[];
  tags?: string[];
  
  // Media
  image?: string;
  image_title?: string;
  image_desc?: string;
  main_media_id?: number;
  
  // URLs
  original_url?: string;
  canonical_url?: string;
  
  // Status
  status?: 'draft' | 'published' | 'archived';
  visibility?: 'public' | 'private';
  
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
  
  // Relations
  source_fk?: number;
  editor_id?: number;
}

export class NewsFetchError extends Error {
  constructor(
    message: string,
    public code: string = 'NEWS_FETCH_ERROR',
    public cause?: unknown
  ) {
    super(message);
    this.name = 'NewsFetchError';
  }
}

export class ValidationError extends NewsFetchError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Add any other types that were previously in the old types file
