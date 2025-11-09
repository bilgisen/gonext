// hooks/useTagNews.ts
import { 
  useInfiniteQuery, 
  useQuery,
  type UseInfiniteQueryOptions, 
  type QueryFunctionContext
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NewsItem } from '@/types/news';

interface UseTagNewsOptions {
  /**
   * Single tag to filter by
   */
  tag?: string;
  
  /**
   * Multiple tags to filter by (OR condition)
   */
  tags?: string[];
  
  /**
   * Category to filter by
   */
  category?: string;
  
  /**
   * Number of items per page
   * @default 12
   */
  limit?: number;
  
  /**
   * Sorting option
   * @default 'newest'
   */
  sort?: 'newest' | 'oldest' | 'popular' | 'trending';
  
  /**
   * Whether the query is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Time range for trending/popular posts (in days)
   * @default 7
   */
  timeRange?: number;
  
  /**
   * Minimum view count to be considered "popular"
   * @default 1000
   */
  minViewCount?: number;
  
  /**
   * Additional query options
   */
  options?: Omit<UseInfiniteQueryOptions<NewsListResponseData, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam'>;
}

interface NewsListResponseData {
  data: {
    items: NewsItem[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
    total_pages: number;
  };
}

// Using QueryFunctionContext directly from @tanstack/react-query

// Helper function to determine sort field based on sort option
function getSortField(sort: string): string {
  switch (sort) {
    case 'popular':
      return 'view_count';
    case 'trending':
      return 'trending_score';
    default:
      return 'published_at';
  }
}

// Helper function to determine sort order
function getSortOrder(sort: string): 'asc' | 'desc' {
  return sort === 'oldest' ? 'asc' : 'desc';
}

export function useTagNews({
  tag,
  tags = [],
  category,
  limit = 12,
  sort = 'newest',
  enabled = true,
  timeRange = 7,
  minViewCount = 1000,
  options = {
    initialPageParam: 1  // Provide default value here
  } as UseInfiniteQueryOptions<NewsListResponseData, Error>,
}: UseTagNewsOptions = {}) {
  const allTags = useMemo(() => {
    const result = [...new Set([...(tag ? [tag] : []), ...tags])];
    return result.length > 0 ? result : undefined;
  }, [tag, tags]);

  const queryKey = useMemo(
    () => ['tag-news', { tags: allTags, category, limit, sort, timeRange, minViewCount }],
    [allTags, category, limit, sort, timeRange, minViewCount]
  );

  const queryFn = async (context: QueryFunctionContext) => {
    const pageParam = context.pageParam ?? 1;
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: limit.toString(),
      sortBy: getSortField(sort),
      sortOrder: getSortOrder(sort),
      ...(sort === 'trending' && { timeRange: timeRange.toString() }),
      ...(sort === 'popular' && { minViewCount: minViewCount.toString() }),
    });

    // Use the first tag for the tag-based query
    const tagSlug = allTags?.[0];
    if (!tagSlug) {
      throw new Error('No tag provided for tag news query');
    }

    const response = await fetch(`/api/tag-news?tag=${encodeURIComponent(tagSlug)}&${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch news by tag');
    }
    
    return response.json() as Promise<NewsListResponseData>;
  };

  return useInfiniteQuery({
    ...options,
    queryKey,
    queryFn,
    initialPageParam: options.initialPageParam ?? 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.data.has_more) return undefined;
      return allPages.length + 1;
    },
    enabled,
  });
}

export function useTrendingTags(limit: number = 20, days: number = 1) {
  return useQuery({
    queryKey: ['trending-tags', limit, days],
    queryFn: async () => {
      const response = await fetch(`/api/tags?limit=${limit}&days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trending tags');
      }
      return response.json();
    },
  });
}

export function useRelatedNews(tags: string[], limit: number = 3, excludeId?: number) {
  return useQuery({
    queryKey: ['related-news', tags, limit, excludeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        tags: tags.join(','),
        limit: limit.toString(),
        ...(excludeId && { excludeId: excludeId.toString() }),
      });

      const response = await fetch(`/api/news/related?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch related news');
      }
      return response.json();
    },
    enabled: tags.length > 0,
  });
}
