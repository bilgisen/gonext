import { useInfiniteQuery, useQuery, QueryFunctionContext } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NewsItem } from '@/types/news';

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
}

export function useNews({
  page = 1,
  limit = 12,
  category,
  tag,
  search,
  sort = 'newest',
  enabled = true,
}: UseNewsOptions = {}) {
  // Build query key
  const queryKey = useMemo(
    () => ['news', { page, limit, category, tag, search, sort }],
    [page, limit, category, tag, search, sort]
  );

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) {
      const categories = Array.isArray(category) ? category.join(',') : category;
      params.append('category', categories);
    }

    if (tag) params.append('tag', tag);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);

    return params;
  }, [page, limit, category, tag, search, sort]);

  const queryFn = async (context: QueryFunctionContext<typeof queryKey, number>) => {
    const pageParam = context.pageParam ?? 1;
    const params = new URLSearchParams(queryParams);
    params.set('page', pageParam.toString());
    
    const response = await fetch(`/api/news?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch news');
    }
    return response.json() as Promise<NewsListResponse>;
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
