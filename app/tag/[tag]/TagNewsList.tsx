'use client';

import { useState } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { urlHelpers } from '@/lib/urlFilters';
import { NewsCard } from '@/app/[category]/NewsCard';
import type { NewsFilters } from '@/lib/urlFilters';

interface TagNewsListProps {
    tag: string;
    searchParams: { [key: string]: string | string[] | undefined };
}

export function TagNewsList({ tag, searchParams }: TagNewsListProps) {
    const [filters] = useState<NewsFilters>({
        tag, // Ensure tag is passed to filters
        ...urlHelpers.parseNewsFilters(new URLSearchParams(
            Object.entries(searchParams).map(([key, value]) =>
                Array.isArray(value) ? [key, value[0]] : [key, value || '']
            ).filter(([_, value]) => value)
        )),
    });

    // Create query params with explicit tag from props
    const queryParams = {
        tag: tag, // Use the tag from props directly to ensure it's always used
        limit: filters.limit || 10,
        ...(filters.excludeId && { excludeId: String(filters.excludeId) })
    };

    // Use the new TanStack Query hooks that fetch from API routes
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteNews(queryParams);

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex gap-4">
                                <div className="shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    <div className="flex gap-2">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-4">
                    Failed to load {tag} news
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const allNews = data?.pages.flatMap(page => page.data.items) || [];
    const totalResults = data?.pages[0]?.data.total || 0;

    if (allNews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-600 dark:text-gray-400 mb-4">
                    No news found with &quot;{tag}&quot; tag
                </div>
                <div className="space-x-4">
                    <button
                        onClick={() => window.location.href = '/news'}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        View All News
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filter Summary */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Showing {totalResults} articles tagged with
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        #{tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}
                    </span>
                </div>
            </div>

            {/* News List */}
            <div className="space-y-6">
                {allNews.map((news) => (
                    <NewsCard
                        key={news.id}
                        news={news}
                        showCategory={true}
                    />
                ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="text-center py-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isFetchingNextPage ? 'Loading...' : `Load More ${tag} News`}
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
