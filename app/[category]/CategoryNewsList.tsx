'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { urlHelpers, type NewsFilters } from '@/lib/urlFilters';
import { cn } from '@/lib/utils';
import { BentoNewsCard } from './BentoNewsCard';
import { CategoryHero } from './categoryHero';

interface CategoryNewsListProps {
  category: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export function CategoryNewsList({ category, searchParams }: CategoryNewsListProps) {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<NewsFilters>({
    category,
    ...urlHelpers.parseNewsFilters(
      new URLSearchParams(
        Object.entries(searchParams)
          .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value || ''])
          .filter(([_, value]) => value)
      )
    ),
  });

  useEffect(() => {
    if (category) {
      queryClient.invalidateQueries({ queryKey: ['infinite-news'], exact: false });
    }
  }, [category, queryClient]);

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
    error,
  } = useInfiniteNews(queryParams);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[400px] rounded-xl bg-muted/20 border border-border/30"
          />
        ))}
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load {category} news
      </div>
    );

  const allNews = data?.pages.flatMap((p) => p.data?.items || []) || [];

  if (allNews.length === 0)
    return (
      <div className="text-center py-12 text-gray-500">
        No news found in {category}.
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        {/* First 2 items as CategoryHero in 2/3 - 1/3 layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allNews.slice(0, 2).map((newsItem, index) => (
            <div key={newsItem.id} className={cn(
              index === 0 ? 'md:col-span-2' : 'md:col-span-1',
              index === 1 ? 'hidden md:block' : ''
            )}>
              <CategoryHero 
                news={newsItem} 
                variant={index === 0 ? 'large' : 'small'}
                className="h-full" 
              />
            </div>
          ))}
        </div>
        
        {/* Remaining items as BentoNewsCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allNews.slice(2).map((newsItem, index) => (
            <BentoNewsCard key={newsItem.id} news={newsItem} index={index} />
          ))}
        </div>
      </div>

      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
