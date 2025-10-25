'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { newsKeys } from '../../lib/queries/queryKeys';
import { getNewsList } from '../../lib/api/externalApiClient';

export function LatestNews() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey: newsKeys.list({ limit: 10 }),
        queryFn: ({ pageParam = 1 }) =>
            getNewsList({ page: pageParam, limit: 10 }),
        getNextPageParam: (lastPage, pages) => {
            if (!lastPage?.has_more) return undefined;
            return pages.length + 1;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">
                    Failed to load latest news
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (isLoading) {
        return <LatestNewsSkeleton />;
    }

    const allNews = data?.pages.flatMap(page => page.items) || [];

    if (allNews.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                    No news articles found
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* News List */}
            <div className="space-y-4">
                {allNews.map((news) => (
                    <NewsItem key={news.id} news={news} />
                ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="text-center py-6">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

function NewsItem({ news }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex gap-4">
                {/* Image */}
                {news.image && (
                    <div className="shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                        <img
                            src={news.image}
                            alt={news.image_title || news.seo_title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                    {news.category}
                                </span>
                                <time className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(news.published_at)}
                                </time>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                <Link
                                    href={`/${news.category}/${news.slug || news.id}`}
                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                                >
                                    {news.seo_title}
                                </Link>
                            </h3>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                {truncateText(news.seo_description, 120)}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                {news.read_time && (
                                    <span>{news.read_time} min read</span>
                                )}
                                {news.tags && news.tags.length > 0 && (
                                    <div className="flex gap-1">
                                        {news.tags.slice(0, 2).map((tag) => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function LatestNewsSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex gap-4">
                            <div className="shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="flex-1 space-y-3">
                                <div className="flex gap-2">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                </div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="flex gap-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
