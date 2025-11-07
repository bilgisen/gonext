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
      // Search is now handled by Algolia, don't include in database query
      
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
    // Always use offset-based pagination if offset is provided
    if (offset !== undefined) {
      params.append('offset', offset.toString());
      params.append('limit', limit.toString());
      // Make sure we don't include page parameter when using offset
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

  // Use the query with proper typing
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      const url = `/api/news?${queryParams.toString()}`;
      console.log('🌐 Fetching news from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch news');
      }
      
      const result = await response.json();
      console.log('📦 News API Response:', {
        success: result.success,
        count: result.data?.items?.length,
        total: result.data?.total,
        hasMore: result.data?.has_more,
        offset: offset,
        limit: limit
      });
      
      return {
        ...result.data,
        offset: offset !== undefined ? offset : undefined,
        limit: limit
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Format the result to match the expected structure
  const formattedData = useMemo(() => {
    if (!queryResult.data) return undefined;
    
    // Extract items from the response
    let items: any[] = [];
    let total = 0;
    
    try {
      // Handle different response formats
      if (Array.isArray(queryResult.data.items)) {
        items = queryResult.data.items;
        total = queryResult.data.total || 0;
      } else if (Array.isArray(queryResult.data.data)) {
        items = queryResult.data.data;
        total = queryResult.data.total || items.length;
      } else if (Array.isArray(queryResult.data)) {
        items = queryResult.data;
        total = items.length;
      } else if (queryResult.data.data && typeof queryResult.data.data === 'object') {
        // Handle case where data is a single object
        items = [queryResult.data.data];
        total = 1;
      }
      
      return {
        pages: [{
          data: {
            items,
            total,
            page: queryResult.data.data?.page || 1,
            limit: queryResult.data.data?.limit || limit,
            has_more: offset !== undefined 
              ? (offset + limit) < total
              : false,
            offset: offset || 0,
          }
        }]
      };
    } catch (error) {
      console.error('Error formatting news data:', error);
      return {
        pages: [{
          data: {
            items: [],
            total: 0,
            page: 1,
            limit,
            has_more: false,
            offset: offset || 0,
          }
        }]
      };
    }
  }, [queryResult.data, limit, offset]);
  
  return {
    ...queryResult,
    data: formattedData,
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