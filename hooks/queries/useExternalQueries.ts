import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { newsKeys } from '../../lib/queries/queryKeys';
import type { NewsFilters, SearchFilters } from '../../types/news';

// Database Query Hooks (using Next.js internal API routes with direct database access)

async function fetchNewsFromDatabase(filters: NewsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.tag) params.append('tag', filters.tag);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = `/api/news${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Database fetch error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch news from database');
  }

  return result.data;
}

async function fetchNewsByIdFromDatabase(id: string) {
  const response = await fetch(`/api/news/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('News item not found');
    }
    throw new Error(`Database fetch error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch news item from database');
  }

  return result.data;
}

/**
 * Hook for fetching news list with filters
 */
export function useNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: () => fetchNewsFromDatabase(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching single news detail
 */
export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => fetchNewsByIdFromDatabase(id),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching featured news
 */
export function useFeaturedNews(limit = 6) {
  return useQuery({
    queryKey: newsKeys.featured(),
    queryFn: () => fetchNewsFromDatabase({ limit }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for infinite scroll news list
 */
export function useInfiniteNews(filters: NewsFilters = {}) {
  return useInfiniteQuery({
    queryKey: newsKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      fetchNewsFromDatabase({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage?.has_more) return undefined;
      return pages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for prefetching news detail on hover
 */
export function usePrefetchNews() {
  const queryClient = useQueryClient();

  const prefetchNewsDetail = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: newsKeys.detail(id),
      queryFn: () => fetchNewsByIdFromDatabase(id),
      staleTime: 30 * 60 * 1000,
    });
  };

  return {
    prefetchNewsDetail,
  };
}
