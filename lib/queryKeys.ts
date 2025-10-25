/**
 * Hierarchical Query Key Factory
 *
 * This system provides type-safe, hierarchical query keys for all data operations.
 * External API data (news, categories, tags) and local DB data (bookmarks, user) are separated.
 *
 * Benefits:
 * - Type-safe query keys
 * - Easy cache invalidation
 * - Consistent naming across the app
 * - Easy to extend and modify
 */

// External API Keys (news, categories, tags from external provider)
export const externalKeys = {
  all: ['external'] as const,

  // News operations
  news: () => [...externalKeys.all, 'news'] as const,
  newsList: (filters: NewsFilters) => [...externalKeys.news(), 'list', filters] as const,
  newsDetail: (id: string) => [...externalKeys.news(), 'detail', id] as const,
  newsRelated: (id: string) => [...externalKeys.news(), 'related', id] as const,

  // Categories
  categories: () => [...externalKeys.all, 'categories'] as const,
  categoryDetail: (slug: string) => [...externalKeys.categories(), 'detail', slug] as const,

  // Tags
  tags: () => [...externalKeys.all, 'tags'] as const,
  tagDetail: (slug: string) => [...externalKeys.tags(), 'detail', slug] as const,

  // Search
  search: () => [...externalKeys.all, 'search'] as const,
  searchResults: (query: string, filters?: SearchFilters) =>
    [...externalKeys.search(), 'results', query, filters] as const,
  searchSuggestions: (query: string) =>
    [...externalKeys.search(), 'suggestions', query] as const,
} as const;

// Local Database Keys (bookmarks, user data, history)
export const localKeys = {
  all: ['local'] as const,

  // User operations
  user: () => [...localKeys.all, 'user'] as const,
  userPreferences: () => [...localKeys.user(), 'preferences'] as const,
  userProfile: () => [...localKeys.user(), 'profile'] as const,

  // Bookmarks
  bookmarks: () => [...localKeys.all, 'bookmarks'] as const,
  bookmarksList: (filters?: BookmarkFilters) => [...localKeys.bookmarks(), 'list', filters] as const,
  bookmarkDetail: (newsId: string) => [...localKeys.bookmarks(), 'detail', newsId] as const,

  // Search history
  searchHistory: () => [...localKeys.all, 'search-history'] as const,
  searchHistoryList: (limit?: number) => [...localKeys.searchHistory(), 'list', limit] as const,

  // Reading history
  readingHistory: () => [...localKeys.all, 'reading-history'] as const,
  readingHistoryList: (limit?: number) => [...localKeys.readingHistory(), 'list', limit] as const,
  readingStats: () => [...localKeys.readingHistory(), 'stats'] as const,
} as const;

// Combined keys for convenience
export const queryKeys = {
  ...externalKeys,
  ...localKeys,

  // Utility keys
  invalidateAll: () => [externalKeys.all, localKeys.all],
} as const;

// Type definitions for filters
export interface NewsFilters {
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'relevance';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SearchFilters {
  category?: string;
  tag?: string;
  limit?: number;
}

export interface BookmarkFilters {
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title';
}
