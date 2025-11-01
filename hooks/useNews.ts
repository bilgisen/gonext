'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import type { NewsItem } from '@/types/news';
import { newsKeys } from '@/lib/queries/queryKeys';

// This hook is now a Client Component due to 'use client' directive

interface UseNewsOptions {
  page?: number;
  limit?: number;
  offset?: number;
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
    offset,
    category,
    tag,
    search,
    sort = 'newest',
    enabled = true,
    queryKey: customQueryKey,
  } = options;

  const { queryKey, queryParams } = useMemo(() => {
    if (customQueryKey) {
      const params = new URLSearchParams();
      if (offset !== undefined) {
        // If offset is provided, use offset-based pagination
        params.append('offset', offset.toString());
        params.append('limit', limit.toString());
      } else {
        // Otherwise use page-based pagination
        params.append('page', page.toString());
        params.append('limit', limit.toString());
      }
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
    
    const type = options.type || (category ? 'category' : tag ? 'tag' : search ? 'search' : 'featured');
    
    // Create a query key that includes offset if present
    const baseQueryKey = {
      type,
      limit,
      ...(category && { category }),
      ...(tag && { tag }),
      ...(search && { search }),
      sort
    };
    
    const finalQueryKey = offset !== undefined 
      ? { ...baseQueryKey, offset }
      : { ...baseQueryKey, page };
    
    const queryKey = newsKeys.list(finalQueryKey);
    
    const params = new URLSearchParams();
    if (offset !== undefined) {
      params.append('offset', offset.toString());
      params.append('limit', limit.toString());
    } else {
      params.append('page', page.toString());
      params.append('limit', limit.toString());
    }
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
  }, [category, tag, search, page, limit, offset, sort, customQueryKey, options.type]);

  useEffect(() => {
    console.log('useNews - Query Key:', queryKey);
    console.log('useNews - Query Params:', queryParams);
    console.log('useNews - Offset:', offset);
  }, [queryKey, queryParams, offset]);

  // Always use useQuery, and handle the response format
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/news?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Format the result to match the expected structure
  return {
    ...queryResult,
    data: queryResult.data ? {
      // Handle both direct items array and nested data.items structure
      pages: [{
        data: {
          // Check if the response has a data property with items, otherwise use the response directly
          items: Array.isArray(queryResult.data.data?.items) 
            ? queryResult.data.data.items 
            : Array.isArray(queryResult.data.data)
              ? queryResult.data.data
              : Array.isArray(queryResult.data)
                ? queryResult.data
                : [],
          // Get total count or default to items length
          total: queryResult.data.total || queryResult.data.data?.total || 0,
          // Calculate has_more based on offset/limit or default to false
          has_more: offset !== undefined 
            ? (offset + limit) < (queryResult.data.total || queryResult.data.data?.total || 0)
            : false,
          offset: offset,
          limit: limit
        }
      }]
    } : undefined,
    // Calculate pagination states
    hasNextPage: offset !== undefined 
      ? (offset + limit) < (queryResult.data?.total || queryResult.data?.data?.total || 0)
      : false,
    fetchNextPage: () => Promise.resolve(),
    isFetchingNextPage: false,
    hasPreviousPage: offset ? offset > 0 : false,
    fetchPreviousPage: () => Promise.resolve(),
  };
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