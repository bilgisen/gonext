// app/news/NewsListClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import FrontCategoryLayoutOne from '@/components/front-category/headlines';
import { Button } from '@/components/ui/button';
import BlobImage from '@/components/BlobImage';
import { Calendar, Clock } from 'lucide-react';

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

  // Flatten all pages of items
  const allItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
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
  if (isLoading && !allItems.length) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // No results
  if (!allItems.length) {
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
      <div className="space-y-8">
        {allItems.length > 0 && (
          <FrontCategoryLayoutOne
            initialData={{
              mainItem: allItems[0],
              leftItems: allItems.slice(1, 3),
              rightItems: allItems.slice(3, 6)
            }}
          />
        )}
        {allItems.length > 6 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allItems.slice(6).map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                {item.image && (
                  <div className="aspect-video bg-gray-100 relative">
                    <BlobImage
                      imageKey={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {item.excerpt}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    {item.published_at && (
                      <time dateTime={item.published_at} className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(item.published_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    )}
                    {item.read_time > 0 && (
                      <span className="flex items-center ml-4">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {item.read_time} dk
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
    <div className="animate-pulse space-y-4">
      <div className="aspect-video bg-muted rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="h-3 bg-muted rounded w-1/4" />
    </div>
  );
}