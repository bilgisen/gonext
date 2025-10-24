import { z } from 'zod';

// News API Response Types
export const NewsApiItemSchema = z.object({
  id: z.string(),
  source_guid: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  tldr: z.array(z.string()),
  content_md: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  image: z.string().url(),
  image_title: z.string(),
  image_desc: z.string().optional(),
  original_url: z.string().url(),
  file_path: z.string(),
  created_at: z.string(),
  published_at: z.string(),
  updated_at: z.string(),
});

export const NewsApiResponseSchema = z.object({
  items: z.array(NewsApiItemSchema),
  page: z.number().optional(),
  page_size: z.number().optional(),
  total: z.number().optional(),
});

export type NewsApiItem = z.infer<typeof NewsApiItemSchema>;
export type NewsApiResponse = z.infer<typeof NewsApiResponseSchema>;

// Category mapping types
export type CategoryMapping = {
  [key: string]: string;
};

// Slug generation options
export interface SlugOptions {
  maxLength?: number;
  separator?: string;
  lowercase?: boolean;
}

// Database operation types
export interface NewsInsertData {
  source_guid: string;
  source_id: string;
  source_fk: number;
  title: string;
  seo_title?: string;
  seo_description?: string;
  excerpt?: string;
  content_md: string;
  content_html?: string;
  main_media_id?: number;
  slug: string;
  canonical_url: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private';
  editor_id?: number;
  word_count: number;
  reading_time_min: number;
  published_at?: Date;
  meta?: Record<string, any>;
}

// Fetch options
export interface FetchNewsOptions {
  limit?: number;
  offset?: number;
  force?: boolean; // Force refresh even if duplicates exist
}

// Error types
export class NewsFetchError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
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

export class DuplicateError extends NewsFetchError {
  constructor(message: string, public duplicateField: string) {
    super(message, 'DUPLICATE_ERROR');
    this.name = 'DuplicateError';
  }
}
