// app/news/NewsListClient.tsx
'use client';

import { useState } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { NewsCard } from '@/app/[category]/NewsCard';

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
        <div className="text-red-600 dark:text-red-400 mb-4">
          An error occurred while loading news
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <p className="text-gray-500 dark:text-gray-400">No news found matching your criteria.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {data.pages.map((page, i) => (
          <div key={i} className="space-y-6">
            {page.data?.items?.map((news: any) => {
              const processedNews = processNewsItem(news);
              return (
                <div key={processedNews.id} className="hover:shadow-lg transition-shadow">
                  <NewsCard
                    news={processedNews}
                  />
                </div>
              );
            })}
          </div>
        ))}
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {data?.pages[0]?.data?.total ? `Total ${data.pages[0].data.total} news articles` : 'Loading news...'}
          </span>
          {Object.entries(cleanFilters(filters)).map(([key, value]) => 
            value ? (
              <span key={key} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More News'}
          </button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton for news cards
const NewsCardSkeleton = () => (
  <div className="animate-pulse group relative flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div className="w-full sm:w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  </div>
);
