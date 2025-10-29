import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { newsKeys } from '../../lib/queries/queryKeys';
import type { NewsFilters, NewsItem } from '../../types/news';

export interface NewsListResponse {
  success: boolean;
  data: {
    items: NewsItem[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

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
export function useInfiniteNews({
  category,
  tag,
  limit = 10,
  excludeId,
}: {
  category?: string;
  tag?: string;
  limit?: number;
  excludeId?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['news', 'infinite', { category, tag, limit, excludeId }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchNewsFromDatabase({
        category,
        tag,
        page: pageParam as number,
        limit,
        excludeId,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch news');
      }

      return {
        ...response,
        data: {
          ...response.data,
          has_more: response.data.items.length >= (limit || 10)
        }
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.has_more) return undefined;
      return allPages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useRelatedNews(currentSlug: string, limit: number = 6) {
  return useQuery({
    queryKey: ['related-news', currentSlug, limit],
    queryFn: async () => {
      const response = await fetch(`/api/news/related?for=${currentSlug}&limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch related news');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch related news');
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!currentSlug,
  });
}
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
