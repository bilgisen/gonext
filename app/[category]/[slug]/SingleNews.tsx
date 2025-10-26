'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { newsKeys } from '@/lib/queries/queryKeys';
import { useNewsDetail, useNews } from '@/hooks/queries/useExternalQueries';
import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { OptimizedImage } from '@/lib/image-utils';
import { normalizeImageUrl } from '@/lib/utils/image';

interface SingleNewsProps {
    category: string;
    slug: string;
}

export function SingleNews({ category, slug }: SingleNewsProps) {
    // Use the new TanStack Query hooks that fetch from API routes
    const { data: newsItem, isLoading, error } = useNewsDetail(slug);
    
    // Extract the correct image path from the URL
    const getImagePath = (url: string) => {
        if (!url) return '';

        // If it's already a correct Netlify Blobs URL, extract just the filename
        if (url.includes('.netlify.app/.netlify/blobs/')) {
            return url.split('/').pop() || '';
        }

        // If it's an API route URL, extract the filename
        if (url.startsWith('/api/blobs/')) {
            return url.replace('/api/blobs/', '');
        }

        // If it's a full HTTP URL, extract the path after the domain
        if (url.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname.replace(/^\/+/, '');
            } catch {
                return url.split('/').pop() || '';
            }
        }

        // If it's already a relative path, return as is
        return url;
    };
    
    const imagePath = newsItem?.image ? normalizeImageUrl(newsItem.image) : '';
    const imageUrl = imagePath;

    // Get related news using category filter
    const { data: relatedNews } = useNews({ category, limit: 4 });

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        News Article Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        The requested article could not be found or may have been removed.
                    </p>
                    <div className="space-x-4">
                        <Link
                            href={`/category/${category}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Back to {category.charAt(0).toUpperCase() + category.slice(1)} News
                        </Link>
                        <Link
                            href="/news"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            All News
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || !newsItem) {
        return <SingleNewsSkeleton />;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <article className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        {
                            label: category.charAt(0).toUpperCase() + category.slice(1),
                            href: `/category/${category}`
                        },
                        {
                            label: 'Article'
                        }
                    ]}
                />

                {/* Article Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            {newsItem.category}
                        </span>
                        <time className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(newsItem.published_at)}
                        </time>
                        {newsItem.read_time && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                • {newsItem.read_time} min read
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {newsItem.title}
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        {newsItem.seo_description}
                    </p>

                    {/* Tags */}
                    {newsItem.tags && newsItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {newsItem.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}
                </header>

                {/* Article Image */}
                {imageUrl && (
                    <div className="relative w-full mb-8 rounded-lg overflow-hidden">
                        <div className="relative w-full h-64 md:h-96">
                            <OptimizedImage
                                src={imageUrl}
                                alt={newsItem.image_title || newsItem.seo_title || 'News image'}
                                width={1200}
                                height={675}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                    console.error('Error loading image:', imageUrl);
                                    if (e.currentTarget) {
                                        e.currentTarget.style.display = 'none';
                                    }
                                }}
                            />
                        </div>
                        {newsItem.image_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                                {newsItem.image_title}
                            </p>
                        )}
                    </div>
                )}

                {/* Article Content */}
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: newsItem.content_md }} />

                {/* Article Footer */}
                <footer className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                {newsItem.category}
                            </span>
                            <time className="text-sm text-gray-600 dark:text-gray-400">
                                Published {formatDate(newsItem.published_at)}
                            </time>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/category/${category}`}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                More {category.charAt(0).toUpperCase() + category.slice(1)} News
                            </Link>
                        </div>
                    </div>
                </footer>

                {/* Related News */}
                {relatedNews?.items && relatedNews.items.length > 1 && (
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            Related Articles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedNews.items
                                .filter(item => item.id !== newsItem.id)
                                .slice(0, 4)
                                .map((relatedNewsItem) => (
                                    <article key={relatedNewsItem.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                                        {relatedNewsItem.image && (
                                            <div className="aspect-video">
                                                <img
                                                    src={normalizeImageUrl(relatedNewsItem.image)}
                                                    alt={relatedNewsItem.image_title || relatedNewsItem.seo_title}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                <Link
                                                    href={`/${relatedNewsItem.category}/${relatedNewsItem.slug || relatedNewsItem.id}`}
                                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    {relatedNewsItem.seo_title}
                                                </Link>
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                                {relatedNewsItem.seo_description.length > 100
                                                    ? relatedNewsItem.seo_description.substring(0, 100) + '...'
                                                    : relatedNewsItem.seo_description}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                    {relatedNewsItem.category}
                                                </span>
                                                <time>
                                                    {new Date(relatedNewsItem.published_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </time>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                        </div>
                    </section>
                )}
            </article>
        </div>
    );
}

function SingleNewsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <div className="flex gap-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                        <div className="flex gap-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>

                    {/* Content */}
                    <div className="space-y-4 mb-8">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                            </div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
