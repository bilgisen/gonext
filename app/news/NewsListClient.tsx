// app/news/NewsListClient.tsx
'use client';

import { useMemo } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { Button } from '@/components/ui/button';
import NewsCard from '@/components/cards/NewsCard';
import NewsLayout from '@/components/cards/NewsLayout';
import type { NewsItem } from '@/types/news';

interface NewsListClientProps {
  initialFilters?: {
    category?: string;
    limit?: number;
    page?: number;
    [key: string]: any;
  };
}

export function NewsListClient({ initialFilters = { limit: 15 } }: NewsListClientProps) {
  const sortOptions = { sortBy: 'newest' as const, sortOrder: 'desc' as const };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteNews({
    ...initialFilters,
    ...sortOptions,
  });

  // Get all items from all pages
  const allItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page?.items || []) as NewsItem[];
  }, [data]);

  // Group items for layout - 1 main + 2 side items per group
  const groupedItems = useMemo(() => {
    if (!allItems || allItems.length === 0) return [];
    const groups = [];
    
    // Create groups of 3 items (1 main + 2 side)
    for (let i = 0; i < allItems.length; i += 3) {
      const group = allItems.slice(i, i + 3);
      if (group.length >= 3) {
        groups.push({
          main: group[0],
          side: [group[1], group[2]] as [NewsItem, NewsItem],
          variant: (Math.floor(i / 3) % 2 === 0 ? 'a' : 'b') as 'a' | 'b'
        });
      } else {
        // If we have less than 3 items left, just add them as regular cards
        groups.push(...group.map(item => ({ single: item })));
      }
    }
    
    return groups;
  }, [allItems]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: initialFilters?.limit || 15 }).map((_, i) => (
          <NewsCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Error loading news: {error?.message || 'Unknown error'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => refetch()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    );
  }

  // No results
  if (allItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No news articles found.</p>
        <Button
          onClick={() => refetch()}
          variant="default"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedItems.map((group, index) => {
        if ('single' in group) {
          return <NewsCard key={`single-${index}`} item={group.single} />;
        }
        
        return (
          <NewsLayout
            key={`layout-${index}`}
            mainNews={group.main}
            sideNews={group.side}
            variant={group.variant}
            className="mb-8"
          />
        );
      })}
      
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-w-[120px]"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Loading skeleton component for individual news card
function NewsCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <div className="relative w-full pt-[56.25%] bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3 animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

// NewsListSkeleton has been removed as it was unused