import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import type { NewsItem } from '@/types/news';
import { newsKeys } from '@/lib/queries/queryKeys';

interface NewsListResponse {
  data: {
    items: NewsItem[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

interface UseNewsOptions {
  page?: number;
  limit?: number;
  category?: string | string[];
  tag?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular';
  enabled?: boolean;
  queryKey?: unknown[];
  type?: 'category' | 'tag' | 'search' | 'featured';
}

export function useNews(options: UseNewsOptions = {}) {
  const {
    page = 1,
    limit = 12,
    category,
    tag,
    search,
    sort = 'newest',
    enabled = true,
    queryKey: customQueryKey,
    type,
  } = options;

  // Build query key and params
  const { queryKey, queryParams } = useMemo(() => {
    // If custom query key is provided, use it directly
    if (customQueryKey) {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      if (category) {
        const categories = Array.isArray(category) ? category : [category];
        params.append('category', categories.join(','));
      }
      if (tag) params.append('tag', tag);
      if (search) params.append('search', search);
      
      return {
        queryKey: customQueryKey,
        queryParams: params
      };
    }
    
    // Otherwise, build the query key and params
    const type = options.type || (category ? 'category' : tag ? 'tag' : search ? 'search' : 'featured');
    const queryKey = newsKeys.list({
      type,
      page,
      limit,
      ...(category && { category }),
      ...(tag && { tag }),
      ...(search && { search }),
      sort
    });
    
    // Build query params for the API call
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      params.append('category', categories.join(','));
    }
    if (tag) params.append('tag', tag);
    if (search) params.append('search', search);
    
    return {
      queryKey,
      queryParams: params
    };
  }, [category, tag, search, page, limit, sort, customQueryKey, options.type]);

  useEffect(() => {
    console.log('useNews - Query Key:', queryKey);
    console.log('useNews - Query Params:', queryParams);
  }, [queryKey, queryParams]);

  // Use the query params from the memoized value
  const queryFn = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams(queryParams.toString());
    params.set('page', pageParam.toString());
    
    const response = await fetch(`/api/news?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

  return useInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => {
      return lastPage.data.has_more ? lastPage.data.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useNewsItem(id: string) {
  return useQuery<{ data: NewsItem }, Error>({
    queryKey: ['news', id],
    queryFn: async () => {
      const response = await fetch(`/api/news/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news item');
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRelatedNews(id: string, limit = 3) {
  return useQuery<{ data: NewsItem[] }, Error>({
    queryKey: ['related-news', id],
    queryFn: async () => {
      const response = await fetch(`/api/news/related/${id}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch related news');
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
