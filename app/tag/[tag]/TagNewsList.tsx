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
        limit: 15, // Show 15 news items
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

    // Group news items into chunks of 3 for layouts and remaining items
    const { layoutChunks, remainingItems } = useMemo(() => {
        const currentPages = data?.pages || [];
        const allItems = currentPages.flatMap(page => page.items || []);
        const chunkSize = 3;
        const result = {
            layoutChunks: [] as NewsItem[][],
            remainingItems: [] as NewsItem[]
        };
        
        for (let i = 0; i < allItems.length; i += chunkSize) {
            const chunk = allItems.slice(i, i + chunkSize);
            if (chunk.length === chunkSize) {
                result.layoutChunks.push(chunk);
            } else {
                result.remainingItems = chunk;
            }
        }
        
        return result;
    }, [data?.pages]); // This will trigger a re-calculation when data?.pages changes

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
            {/* News List */}
            <div className="space-y-8">
                {/* Layout chunks with alternating variants */}
                {layoutChunks.map((chunk, index) => (
                    <div key={`layout-${index}`} className="mb-12 last:mb-0">
                        <NewsLayout
                            mainNews={chunk[0]}
                            sideNews={[chunk[1], chunk[2]]}
                            variant={index % 2 === 0 ? 'a' : 'b'}
                            showCategory={true}
                            showDate={true}
                            showReadTime={true}
                            showDescription={true}
                        />
                    </div>
                ))}

                {/* Remaining news items in a grid */}
                {remainingItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
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
                )}
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
