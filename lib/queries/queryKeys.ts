import type { NewsFilters } from '../../types/news';

/**
 * Query keys factory for TanStack Query
 * Provides hierarchical, serializable keys for all queries
 */
export const newsKeys = {
    all: ['news'] as const,

    // List queries
    lists: () => [...newsKeys.all, 'list'] as const,
    list: (filters: NewsFilters) => [...newsKeys.lists(), filters] as const,

    // Detail queries
    details: () => [...newsKeys.all, 'detail'] as const,
    detail: (id: string) => [...newsKeys.details(), id] as const,

    // Category queries
    categories: () => [...newsKeys.all, 'categories'] as const,
    category: (category: string) => [...newsKeys.categories(), category] as const,

    // Tag queries
    tags: () => [...newsKeys.all, 'tags'] as const,
    tag: (tag: string) => [...newsKeys.tags(), tag] as const,

    // Featured queries
    featured: () => [...newsKeys.all, 'featured'] as const,

    // Search queries
    search: (query: string) => [...newsKeys.all, 'search', query] as const,

    // User-specific queries
    bookmarks: (userId: string) => [...newsKeys.all, 'bookmarks', userId] as const,
    history: (userId: string) => [...newsKeys.all, 'history', userId] as const,
};

// Export as queryKeys for backward compatibility
export const queryKeys = newsKeys;
