// hooks/queries/useExternalQueries.ts
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
  error?: string;
}

interface NewsApiResponse {
  items: NewsItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Database Query Hooks (using Next.js internal API routes with direct database access)

export async function fetchNewsFromDatabase(filters: NewsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.category) {
    const categories = Array.isArray(filters.category) 
      ? filters.category.join(',') 
      : filters.category;
    params.append('category', categories);
  }
  if (filters.tag) params.append('tag', filters.tag);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  // Note: Search is handled by Algolia, not in the database query
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const url = `${baseUrl}/api/news${queryString ? `?${queryString}` : ''}`;

  try {
    console.log('📡 Fetching news from:', url);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add this option to handle cookies if needed
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Ensure the response has the expected structure
    if (!result || typeof result !== 'object') {
      console.error('❌ Invalid response format from server:', result);
      throw new Error('Invalid response format from server');
    }

    if (!result.success) {
      console.error('❌ API returned error:', result.error);
      throw new Error(result.error || 'Failed to fetch news from database');
    }

    console.log('✅ Fetched news successfully, items count:', result.data?.items?.length || 0);
    return result.data;
  } catch (error) {
    console.error('❌ Error in fetchNewsFromDatabase:', error);
    throw new Error('Failed to fetch news. Please try again later.');
  }
}

async function fetchNewsByIdFromDatabase(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${baseUrl}/api/news/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  });

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
type SortOption = 'newest' | 'oldest' | 'popular';

export function useInfiniteNews({
  category,
  tag,
  limit = 15,
  excludeId,
  sortBy = 'newest',
  sortOrder = 'desc',
}: {
  category?: string;
  tag?: string;
  limit?: number;
  excludeId?: string;
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  return useInfiniteQuery<NewsApiResponse>({
    queryKey: ['news', 'infinite', { category, tag, limit, excludeId, sortBy, sortOrder }],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        console.log(`🔄 Fetching page ${pageParam} for category: ${category || 'all'}`);
        
        const response = await fetchNewsFromDatabase({
          category,
          tag,
          page: pageParam as number,
          limit, // Pass the limit parameter
          sort: sortBy,
          sortOrder, // Add sortOrder to the filters
          status: 'published',
          ...(excludeId && { excludeId }),
        });

        console.log('📡 Raw API Response:', JSON.stringify(response, null, 2));

        if (!response || !Array.isArray(response.items)) {
          console.error('❌ Invalid response format from API:', response);
          throw new Error('Invalid response format: missing items array');
        }
        if (!response || !Array.isArray(response.items)) {
          console.error('❌ Invalid response format:', response);
          throw new Error('Invalid response format: missing items array');
        }

        // Ensure all required fields are present
        const result: NewsApiResponse = {
          items: response.items,
          total: response.total || response.items.length,
          page: response.page || (pageParam as number),
          limit: response.limit || limit,
          has_more: response.has_more || response.items.length >= limit,
        };

        console.log(`✅ Fetched ${result.items.length} items, has more: ${result.has_more}`);
        return result;
      } catch (error) {
        console.error('❌ Error in useInfiniteNews queryFn:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
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
