'use client';

import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { useMemo } from 'react';

// Maximum number of categories we'll support
const MAX_CATEGORIES = 3;

// Custom hook that handles multiple categories
export function useCategoryNews(category: string | string[], limit: number = 12) {
  const categories = useMemo(() => 
    (Array.isArray(category) ? category : [category])
      .filter(Boolean) // Remove any empty strings
      .slice(0, MAX_CATEGORIES)
  , [category]);
  
  // Call the hook for each category (always the same number of hooks)
  const query1 = useInfiniteNews({ 
    category: categories[0] || '', 
    limit,
  });
  
  const query2 = useInfiniteNews({ 
    category: categories[1] || '', 
    limit,
  });
  
  const query3 = useInfiniteNews({ 
    category: categories[2] || '', 
    limit,
  });
  
  // Memoize the queries array to prevent unnecessary re-renders
  const queries = useMemo(() => [query1, query2, query3], [query1, query2, query3]);

  // Combine news from all categories, filtering out empty categories
  const allNews = useMemo(() => {
    return categories.map((cat, index) => {
      if (!cat) return [];
      const query = queries[index];
      return query.data?.pages.flatMap((p: any) => p?.data?.items || []) || [];
    }).flat();
  }, [queries, categories]);

  // Only consider loading state for active categories
  const isLoading = useMemo(() => 
    categories.some((cat, index) => cat && queries[index]?.isLoading)
  , [categories, queries]);
  
  // Get the first error from active categories
  const error = useMemo(() => 
    queries.find((query, index) => categories[index] && query.error)?.error
  , [queries, categories]);

  return { allNews, isLoading, error };
}
