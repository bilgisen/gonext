'use client';

import Link from 'next/link';

interface NewsCardProps {
    news: {
        id: string;
        seo_title: string;
        seo_description: string;
        category: string;
        tags?: string[];
        image?: string;
        image_title?: string;
        published_at: string;
        read_time?: number;
        slug?: string;
    };
    showCategory?: boolean;
    featured?: boolean;
}

export function NewsCard({ news, showCategory = true, featured = false }: NewsCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const truncateText = (text: string, maxLength: number) => {
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
                    {showCategory && (
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                {news.category}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        {showCategory && !news.image && (
                            <div className="mb-2">
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                    {news.category}
                                </span>
                            </div>
                        )}

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
