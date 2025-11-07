// app/news/NewsListClient.tsx
'use client';

import { useState, useMemo } from 'react';
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

type SortOption = 'newest' | 'oldest' | 'popular';

export function NewsListClient({ initialFilters = {} }: NewsListClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const getApiSortOption = (): { sortBy: SortOption; sortOrder: 'asc' | 'desc' } => {
    switch (sortBy) {
      case 'newest': return { sortBy: 'newest', sortOrder: 'desc' };
      case 'oldest': return { sortBy: 'oldest', sortOrder: 'asc' };
      case 'popular': return { sortBy: 'popular', sortOrder: 'desc' };
      default: return { sortBy: 'newest', sortOrder: 'desc' };
    }
  };

  const apiSort = getApiSortOption();

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
    sortBy: apiSort.sortBy,
    sortOrder: apiSort.sortOrder,
  });

  // Flatten all pages of items and group them for layouts
  const { featuredItems, layoutItems } = useMemo(() => {
    if (!data?.pages) return { featuredItems: [], layoutItems: [] };
    
    const allItems = data.pages.flatMap((page) => page.items || []) as NewsItem[];
    const featured = allItems.slice(0, 2);
    const remaining = allItems.slice(2);
    
    // Group remaining items into chunks of 3 for layout patterns
    const layoutGroups: Array<{
      main: NewsItem;
      side: [NewsItem, NewsItem];
      variant: 'a' | 'b';
    }> = [];
    
    for (let i = 0; i < remaining.length; i += 3) {
      const group = remaining.slice(i, i + 3);
      if (group.length === 3) {
        layoutGroups.push({
          main: group[0],
          side: [group[1], group[2]] as [NewsItem, NewsItem],
          variant: (Math.floor(i / 3) % 2 === 0 ? 'a' : 'b') as 'a' | 'b'
        });
      }
    }
    
    return { featuredItems: featured, layoutItems: layoutGroups };
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handle error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          Error loading news: {error?.message || 'Unknown error'}
        </div>
        <Button
          onClick={() => refetch()}
          variant="default"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading && !featuredItems.length && !layoutItems.length) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // No results
  if (!featuredItems.length && !layoutItems.length) {
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
      {/* Sort controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('newest')}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === 'oldest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('oldest')}
          >
            Oldest
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('popular')}
          >
            Most Popular
          </Button>
        </div>
      </div>

      {/* News grid */}
      <div className="space-y-12">
        {/* Featured section */}
        {featuredItems.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredItems.map((item) => (
                <NewsCard 
                  key={item.id} 
                  item={item} 
                  variant="medium"
                  className="h-full"
                  showDescription={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Latest News with alternating layouts */}
        {layoutItems.length > 0 && (
          <div className="space-y-12">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <div className="space-y-8">
              {layoutItems.map((layout, index) => {
                // Ensure we have exactly 2 side items
                const sideNews: [NewsItem, NewsItem] = [
                  layout.side[0],
                  layout.side[1] || layout.side[0] // Fallback to first item if second is missing
                ];
                
                return (
                  <div key={index} className="space-y-2">
                    <NewsLayout
                      mainNews={layout.main}
                      sideNews={sideNews}
                      variant={layout.variant}
                      showCategory={true}
                      showDate={true}
                      showReadTime={true}
                      showDescription={true}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Loading skeleton component
function NewsCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <div className="relative w-full pt-[56.25%] bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-2 animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6 animate-pulse" />
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4 animate-pulse" />
          <div className="flex space-x-2">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}