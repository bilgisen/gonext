'use client';

import { useState, useMemo } from 'react';
import { useInfiniteNews } from '@/hooks/queries/useExternalQueries';
import { urlHelpers } from '@/lib/urlFilters';
import NewsCard from '@/components/cards/NewsCard';
import { NewsLayout } from '@/components/cards/NewsLayout';
import type { NewsFilters } from '@/lib/urlFilters';
import type { NewsItem } from '@/types/news';

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

    // Group news items for layout (first 3 items in a layout, rest as cards)
    const { layoutItems, remainingItems } = useMemo(() => {
        if (!data?.pages?.length) return { layoutItems: [], remainingItems: [] };
        
        const allItems = data.pages.flatMap(page => page.items || []) as NewsItem[];
        
        // First 3 items for the layout
        const layoutItems = allItems.length >= 3 ? allItems.slice(0, 3) : [];
        // Remaining items for individual cards
        const remainingItems = allItems.slice(3);
        
        return { layoutItems, remainingItems };
    }, [data]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-card rounded-lg overflow-hidden border">
                        <div className="w-full aspect-video bg-muted" />
                        <div className="p-4 space-y-3">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-5/6"></div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-4 bg-muted rounded w-20"></div>
                                <div className="h-4 bg-muted rounded w-16"></div>
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
                <div className="text-error mb-4">
                    Failed to load {tag} news
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-error text-error-foreground rounded-lg hover:bg-error/90"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const allNews = data?.pages.flatMap(page => page.items) || [];
    const totalResults = data?.pages[0]?.total || 0;

    if (allNews.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                    No news found with &quot;{tag}&quot; tag
                </div>
                <div className="space-x-4">
                    <button
                        onClick={() => window.location.href = '/news'}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
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
            <div className="space-y-8">
                {/* Layout for first 3 items if available */}
                {layoutItems.length >= 3 && (
                    <NewsLayout
                        mainNews={layoutItems[0]}
                        sideNews={[layoutItems[1], layoutItems[2]]}
                        variant="a"
                        showCategory={true}
                        showDate={true}
                        showReadTime={true}
                        showDescription={true}
                    />
                )}

                {/* Remaining news items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingItems.map((news) => (
                        <NewsCard
                            key={news.id}
                            item={news}
                            variant="medium"
                            showCategory={true}
                            showDate={true}
                            showReadTime={true}
                            showDescription={true}
                        />
                    ))}
                </div>
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
