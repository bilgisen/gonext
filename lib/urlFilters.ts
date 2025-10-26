import { parseAsString, parseAsInteger } from 'nuqs';

// URL Query Parsers using nuqs
export const newsFiltersParser = {
  category: parseAsString,
  tag: parseAsString,
  page: parseAsInteger,
  limit: parseAsInteger,
  sortBy: parseAsString,
  search: parseAsString,
};

export const searchFiltersParser = {
  q: parseAsString,
  category: parseAsString,
  page: parseAsInteger,
  limit: parseAsInteger,
};

// Default values
export interface NewsFilters {
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'relevance';
  search?: string;
  excludeId?: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const defaultNewsFilters: NewsFilters = {
  page: 1,
  limit: 20,
  sortBy: 'date',
};

export const defaultSearchFilters: SearchFilters = {
  page: 1,
  limit: 20,
};

// URL Query Keys
export const newsQueryKeys = {
  category: 'category',
  tag: 'tag',
  page: 'page',
  limit: 'limit',
  sortBy: 'sortBy',
  search: 'search',
} as const;

export const searchQueryKeys = {
  query: 'q',
  category: 'category',
  page: 'page',
  limit: 'limit',
} as const;

// Utility functions for URL manipulation
export const urlHelpers = {
  // Build news list URL
  buildNewsUrl: (filters: Partial<NewsFilters> = {}) => {
    const params = new URLSearchParams();

    if (filters.category) params.set(newsQueryKeys.category, filters.category);
    if (filters.tag) params.set(newsQueryKeys.tag, filters.tag);
    if (filters.page && filters.page > 1) params.set(newsQueryKeys.page, filters.page.toString());
    if (filters.limit && filters.limit !== defaultNewsFilters.limit) {
      params.set(newsQueryKeys.limit, filters.limit.toString());
    }
    if (filters.sortBy && filters.sortBy !== defaultNewsFilters.sortBy) {
      params.set(newsQueryKeys.sortBy, filters.sortBy);
    }
    if (filters.search) params.set(newsQueryKeys.search, filters.search);

    const queryString = params.toString();
    return `/news${queryString ? `?${queryString}` : ''}`;
  },

  // Build search URL
  buildSearchUrl: (filters: Partial<SearchFilters> = {}) => {
    const params = new URLSearchParams();

    if (filters.q) params.set(searchQueryKeys.query, filters.q);
    if (filters.category) params.set(searchQueryKeys.category, filters.category);
    if (filters.page && filters.page > 1) params.set(searchQueryKeys.page, filters.page.toString());
    if (filters.limit && filters.limit !== defaultSearchFilters.limit) {
      params.set(searchQueryKeys.limit, filters.limit.toString());
    }

    const queryString = params.toString();
    return `/search${queryString ? `?${queryString}` : ''}`;
  },
  parseNewsFilters: (searchParams: URLSearchParams): NewsFilters => {
    const sortBy = searchParams.get(newsQueryKeys.sortBy);
    return {
      category: searchParams.get(newsQueryKeys.category) || undefined,
      tag: searchParams.get(newsQueryKeys.tag) || undefined,
      page: parseInt(searchParams.get(newsQueryKeys.page) || '1'),
      limit: parseInt(searchParams.get(newsQueryKeys.limit) || '20'),
      sortBy: (sortBy === 'popularity' || sortBy === 'relevance' ? sortBy : 'date') as 'date' | 'popularity' | 'relevance',
      search: searchParams.get(newsQueryKeys.search) || undefined,
    };
  },

  parseSearchFilters: (searchParams: URLSearchParams) => {
    return {
      q: searchParams.get(searchQueryKeys.query) || undefined,
      category: searchParams.get(searchQueryKeys.category) || undefined,
      page: parseInt(searchParams.get(searchQueryKeys.page) || '1'),
      limit: parseInt(searchParams.get(searchQueryKeys.limit) || '20'),
    };
  },

  // Clean filters (remove empty/undefined values)
  cleanFilters: <T extends Record<string, any>>(filters: T): Partial<T> => {
    return Object.fromEntries(
      Object.entries(filters).filter(([_, value]) =>
        value !== undefined && value !== '' && value !== null
      )
    ) as Partial<T>;
  },
};
