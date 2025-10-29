// hooks/useCategoryNews.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NewsItem, NewsListResponse } from '@/types/news';

interface UseCategoryNewsOptions {
  category: string;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'popular';
  enabled?: boolean;
}

interface NewsListResponseData {
  data: {
    items: NewsItem[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

export function useCategoryNews({
  category,
  limit = 12,
  sort = 'newest',
  enabled = true,
}: UseCategoryNewsOptions) {
  const queryKey = ['category-news', { category, limit, sort }];

  const queryFn = async (context: any) => {
    const pageParam = context.pageParam ?? 1;
    const response = await fetch(
      `/api/news/categories/${encodeURIComponent(category)}?` + 
      new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
        sort,
      })
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${category} news`);
    }
    
    return response.json() as Promise<NewsListResponseData>;
  };

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<NewsListResponseData, Error>({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => {
      return lastPage.data.has_more ? lastPage.data.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!category && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Flatten all pages of news items
  const allNews = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data?.items || []) as NewsItem[];
  }, [data]);

  return {
    data: allNews,
    allNews, // For backward compatibility
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
  };
}