// app/news/NewsListClient.tsx
'use client';

import { useState } from 'react';
import { useInfiniteNews } from '../../hooks/queries/useExternalQueries';
import { urlHelpers } from '../../lib/urlFilters';
import { usePrefetchNews } from '../../hooks/queries/useExternalQueries';
import { NewsCard as CategoryNewsCard } from '../[category]/NewsCard';

interface NewsListClientProps {
  initialFilters: any;
}

export function NewsListClient({ initialFilters }: NewsListClientProps) {
  const [filters, setFilters] = useState(initialFilters);
  const { prefetchNewsDetail } = usePrefetchNews();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteNews(filters);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleCardHover = (newsId: string) => {
    prefetchNewsDetail(newsId);
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

  if (error) {
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
                  <CategoryNewsCard
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

  const getImageKey = (url: string) => {
    if (!url) return '';
    
    // If it's already just a key (no slashes)
    if (!url.includes('/')) return url;
    
    // Extract the last part of the URL as the key
    try {
      const urlObj = new URL(url, 'http://dummy.com'); // Using dummy base URL to handle relative URLs
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (e) {
      console.error('Error parsing image URL:', url, e);
      return '';
    }
  };

  // Process news items to ensure they have the required fields
  const processNewsItem = (item: any) => ({
    ...item,
    image: item.image ? getImageKey(item.image) : '',
    tags: item.tags || [],
    image_title: item.image_title || '',
    slug: item.slug || item.id,
    tldr: item.tldr || [],
    content_md: item.content_md || '',
    original_url: item.original_url || '',
    file_path: item.file_path || '',
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
    published_at: item.published_at || item.created_at || new Date().toISOString()
  });

  return (
    <div className="space-y-6">
      {/* Filter Panel - TODO: Implement later */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total {data?.pages[0]?.data?.total || 0} news articles
          </span>
          {Object.entries(urlHelpers.cleanFilters(filters)).map(([key, value]) => (
            value && (
              <span key={key} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {key}: {value}
              </span>
            )
          ))}
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

// News Card Component
const NewsCard = ({ news, onHover }: { news: any; onHover?: () => void }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {news.image && (
        <div className="aspect-video bg-gray-200 dark:bg-gray-700">
          <img
            src={news.image}
            alt={news.image_title || news.seo_title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              <a
                href={`/news/${news.slug || news.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onMouseEnter={onHover}
              >
                {news.seo_title}
              </a>
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {truncateText(news.seo_description, 150)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {news.category && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {news.category}
              </span>
            )}

            <time dateTime={news.published_at}>
              {formatDate(news.published_at)}
            </time>

            {news.read_time && (
              <span>{news.read_time} min read</span>
            )}
          </div>

          {news.tags && news.tags.length > 0 && (
            <div className="flex gap-1">
              {news.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
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
