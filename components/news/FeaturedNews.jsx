'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { newsKeys } from '../../lib/queries/queryKeys';
import { getNewsList } from '../../lib/api/externalApiClient';

export function FeaturedNews() {
    const { data: featuredNews, isLoading, error } = useQuery({
        queryKey: newsKeys.featured(),
        queryFn: () => getNewsList({ limit: 6, featured: true }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">
                    Failed to load featured news
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

    if (isLoading || !featuredNews?.items?.length) {
        return <FeaturedNewsSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNews.items.map((news, index) => (
                <NewsCard key={news.id} news={news} featured={index < 3} />
            ))}
        </div>
    );
}

function NewsCard({ news, featured }) {
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
        <article className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow ${featured ? 'md:col-span-2 lg:col-span-1' : ''}`}>
            {news.image && (
                <div className={`relative ${featured ? 'aspect-video' : 'aspect-video'}`}>
                    <img
                        src={news.image}
                        alt={news.image_title || news.seo_title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                            {news.category}
                        </span>
                    </div>
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 ${featured ? 'text-lg' : 'text-base'}`}>
                            <Link
                                href={`/${news.category}/${news.slug || news.id}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {news.seo_title}
                            </Link>
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                            {truncateText(news.seo_description, featured ? 120 : 100)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                        <time dateTime={news.published_at}>
                            {formatDate(news.published_at)}
                        </time>
                        {news.read_time && (
                            <span>{news.read_time} min read</span>
                        )}
                    </div>

                    {news.tags && news.tags.length > 0 && (
                        <div className="flex gap-1">
                            {news.tags.slice(0, 2).map((tag) => (
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

function FeaturedNewsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 aspect-video rounded-lg mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
