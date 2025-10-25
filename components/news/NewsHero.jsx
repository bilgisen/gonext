'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { newsKeys } from '@/lib/queries/queryKeys';
import { getNewsList } from '@/lib/api/externalApiClient';

export function NewsHero() {
    const { data: featuredNews, isLoading } = useQuery({
        queryKey: newsKeys.featured(),
        queryFn: () => getNewsList({ limit: 3, featured: true }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading || !featuredNews?.items?.length) {
        return <HeroSkeleton />;
    }

    const [mainNews, ...sideNews] = featuredNews.items;

    return (
        <section className="bg-linear-to-br from-blue-600 to-purple-700 text-white">
            <div className="container mx-auto px-4 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Main Featured News */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                Featured Story
                            </span>
                            <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                                <Link
                                    href={`/${mainNews.category}/${mainNews.slug || mainNews.id}`}
                                    className="hover:text-blue-100 transition-colors"
                                >
                                    {mainNews.seo_title}
                                </Link>
                            </h1>
                            <p className="text-lg text-blue-100 leading-relaxed">
                                {mainNews.seo_description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <span className="px-2 py-1 bg-white/20 rounded">
                                {mainNews.category}
                            </span>
                            <time className="text-blue-100">
                                {new Date(mainNews.published_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </time>
                            {mainNews.read_time && (
                                <span className="text-blue-100">
                                    {mainNews.read_time} min read
                                </span>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href={`/${mainNews.category}/${mainNews.slug || mainNews.id}`}
                                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                            >
                                Read More
                            </Link>
                            <Link
                                href="/news"
                                className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                            >
                                All News
                            </Link>
                        </div>
                    </div>

                    {/* Side Featured News */}
                    <div className="space-y-4">
                        {sideNews.map((news) => (
                            <article key={news.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
                                <Link href={`/${news.category}/${news.slug || news.id}`}>
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-100">
                                        {news.seo_title}
                                    </h3>
                                    <p className="text-sm text-blue-100 mb-3 line-clamp-2">
                                        {news.seo_description}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-blue-200">
                                        <span className="px-2 py-1 bg-white/20 rounded">
                                            {news.category}
                                        </span>
                                        <time>
                                            {new Date(news.published_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </time>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function HeroSkeleton() {
    return (
        <section className="bg-linear-to-br from-blue-600 to-purple-700 text-white">
            <div className="container mx-auto px-4 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div className="space-y-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-white/20 rounded w-32"></div>
                            <div className="h-12 bg-white/20 rounded w-full"></div>
                            <div className="h-4 bg-white/20 rounded w-3/4"></div>
                            <div className="h-4 bg-white/20 rounded w-1/2"></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-12 bg-white/20 rounded w-32"></div>
                            <div className="h-12 bg-white/20 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-white/10 rounded-lg p-4 space-y-3">
                                    <div className="h-5 bg-white/20 rounded w-full"></div>
                                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
