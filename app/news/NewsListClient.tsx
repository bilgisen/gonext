// app/news/NewsListClient.tsx
'use client';

import { useState } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import FrontCategoryMainNewsCard from '@/components/cards/front-cat-main-newscard';

// Helper function to clean filters
const cleanFilters = (filters: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  });
  return result;
};

interface NewsListClientProps {
  initialFilters: {
    category?: string;
    limit?: number;
    page?: number;
    [key: string]: any;
  };
}

export function NewsListClient({ initialFilters }: NewsListClientProps) {
  const [filters] = useState(initialFilters);
  // Prefetch functionality is currently not used
  // const { prefetchNewsDetail } = usePrefetchNews();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteNews(filters);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <NewsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          An error occurred while loading news
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const renderNewsList = () => {
    if (!data?.pages?.length) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No news found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.pages.flatMap(page => 
          page.data?.items?.map((news: any) => {
            const processedNews = processNewsItem(news);
            return (
              <div key={processedNews.id} className="h-full">
                <FrontCategoryMainNewsCard
                  item={processedNews}
                  showCategory={true}
                  showDate={true}
                  showReadTime={true}
                  className="h-full"
                />
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Process news items for display
  const processNewsItem = (item: any) => ({
    ...item,
    id: item.id?.toString() || '',
    slug: item.slug || item.id?.toString() || '',
    seo_title: item.seo_title || 'No title',
    seo_description: item.seo_description || '',
    category: item.category || 'general',
    tags: Array.isArray(item.tags) ? item.tags : [],
    image: item.image || '',
    image_title: item.image_title || '',
    published_at: item.published_at || new Date().toISOString(),
    read_time: item.read_time || 0
  });

  return (
    <div className="space-y-6">
      {/* Filter Panel - TODO: Implement later */}
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            {data?.pages[0]?.data?.total ? `Total ${data.pages[0].data.total} news articles` : 'Loading news...'}
          </span>
          {Object.entries(cleanFilters(filters)).map(([key, value]) => 
            value ? (
              <span key={key} className="px-2 py-1 bg-primary/10 text-primary-foreground/90 rounded text-xs">
                {key}: {String(value)}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* News List */}
      {renderNewsList()}

      {/* Load More Button */}
      {hasNextPage && (
        <div className="text-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More News'}
          </button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton for news cards
const NewsCardSkeleton = () => (
  <div className="animate-pulse group relative flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow">
    <div className="w-full sm:w-40 h-40 bg-muted rounded-lg"></div>
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-muted rounded w-24"></div>
      <div className="h-6 bg-muted rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-muted rounded-full"></div>
        <div className="h-6 w-20 bg-muted rounded-full"></div>
      </div>
    </div>
  </div>
);
