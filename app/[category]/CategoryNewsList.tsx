'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { urlHelpers, type NewsFilters } from '@/lib/urlFilters';
import { cn } from '@/lib/utils';
import { CATEGORY_MAPPINGS } from '@/types/news';
import NewsCard from '@/components/cards/NewsCard';
import { CategoryHero } from './categoryHero';

interface CategoryNewsListProps {
  category: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export function CategoryNewsList({ category, searchParams }: CategoryNewsListProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  // Format category name with proper title case
  const formatCategoryName = (name: string): string => {
    if (!name) return '';
    // Special case for 'turkiye' -> 'Türkiye'
    if (name.toLowerCase() === 'turkiye') return 'Türkiye';
    // For other categories, convert to title case
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const [filters] = useState<NewsFilters>(() => {
    // Ensure category slug is in lowercase and matches the database
    const categorySlug = category ? category.toLowerCase() : '';
    
    // Map the category to a slug if it's a display name
    const mappedSlug = CATEGORY_MAPPINGS[categorySlug] || categorySlug;
    
    return {
      category: mappedSlug, // Use the mapped slug for the API request
      ...urlHelpers.parseNewsFilters(
        new URLSearchParams(
          Object.entries(searchParams)
            .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value || ''])
            .filter(([_, value]) => value)
        )
      ),
    };
  });

  // Reset query state when category changes
  useEffect(() => {
    if (category) {
      const queryKey = ['news', 'infinite', { category, limit: filters.limit || 20 }];
      
      // Completely remove the query to clear any error state
      queryClient.removeQueries({ 
        queryKey,
        exact: false
      });
    }
  }, [category, filters.limit, queryClient]);
  
  // Handle retry logic
  const handleRetry = useCallback(() => {
    const queryKey = ['news', 'infinite', { category, limit: filters.limit || 24 }];
    
    // Reset retry count when retrying
    setRetryCount(0);
    
    // Reset the query state before retrying
    queryClient.resetQueries({
      queryKey,
      exact: false
    });
    
    // Force a hard refresh of the data
    queryClient.invalidateQueries({
      queryKey,
      exact: false,
      refetchType: 'active',
    });
  }, [category, filters.limit, queryClient]);

  const queryParams = {
    category: category || '',
    limit: filters.limit || 12,
    ...(filters.excludeId && { excludeId: String(filters.excludeId) }),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteNews(queryParams);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse mt-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
              <div className="flex space-x-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state with retry button
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            Failed to load {formatCategoryName(category)} news
          </h2>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Retrying...' : 'Try Again'}
          </button>
          
          <button
            onClick={() => router.refresh()}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Refresh Page
          </button>
        </div>
        
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            Attempt {retryCount + 1} of 3
          </p>
        )}
      </div>
    );
  }

  const allNews = data?.pages.flatMap((p) => p.items || []) || [];

  if (allNews.length === 0)
    return (
      <div className="text-center py-12 text-gray-500">
        No news found in {formatCategoryName(category)}.
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        {/* First 2 items as CategoryHero in 2/3 - 1/3 layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allNews.slice(0, 2).map((newsItem, index) => (
            <div 
              key={newsItem.id} 
              className={cn(
                index === 0 ? 'md:col-span-2' : 'md:col-span-1',
                index === 1 ? 'hidden md:block' : '',
                'flex flex-col h-full'
              )}
            >
              <CategoryHero 
                news={newsItem} 
                variant={index === 0 ? 'large' : 'small'}
                className="h-full" 
              />
            </div>
          ))}
        </div>
        
        {/* Remaining items in a 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allNews.slice(2).map((newsItem) => (
            <NewsCard 
              key={newsItem.id}
              item={newsItem}
              variant="compact"
              className="h-full"
              showCategory={false}
              showDate={true}
              showReadTime={true}
              showDescription={true}
              showShare={true}
              showFavorite={true}
            />
          ))}
        </div>
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="px-8 py-2 bg-primary/60 text-foreground rounded-lg hover:bg-primary disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
