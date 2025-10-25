import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { newsKeys } from '../../lib/queries/queryKeys';
import { newsService } from '../../lib/api/externalApiClient';
import type { NewsFilters, SearchFilters } from '../../types/news';

// External API Query Hooks

/**
 * Hook for fetching news list with filters
 */
export function useNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: () => newsService.getNews(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching single news detail
 */
export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsService.getNewsById(id),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching featured news
 */
export function useFeaturedNews(limit = 6) {
  return useQuery({
    queryKey: newsKeys.featured(),
    queryFn: () => newsService.getNews({ limit }),
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
      newsService.getNews({ ...filters, page: pageParam }),
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
      queryFn: () => newsService.getNewsById(id),
      staleTime: 30 * 60 * 1000,
    });
  };

  return {
    prefetchNewsDetail,
  };
}
