'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { processNewsItems } from '@/lib/news/process-news';
import { OptimizedImage } from '@/lib/image-utils';
import type { NewsItem } from '@/types/news';

interface NewsCardProps {
  news: NewsItem;
  className?: string;
  showCategory?: boolean;
  featured?: boolean;
}

export function NewsCard({ 
  news: initialNews, 
  className = '', 
  showCategory = true, 
  featured = false 
}: NewsCardProps) {
  const [news, setNews] = useState<NewsItem>({
    ...initialNews,
    // Ensure all required fields have default values
    tags: initialNews.tags || [],
    image: initialNews.image || '',
    image_title: initialNews.image_title || '',
    slug: initialNews.slug || initialNews.id,
    source_guid: initialNews.source_guid || '',
    tldr: initialNews.tldr || [],
    content_md: initialNews.content_md || '',
    original_url: initialNews.original_url || '',
    file_path: initialNews.file_path || '',
    created_at: initialNews.created_at || new Date().toISOString(),
    updated_at: initialNews.updated_at || new Date().toISOString()
  });
  
  const [isImageLoading, setIsImageLoading] = useState(false);

  const publishedAt = new Date(news.published_at);
  const timeAgo = formatDistanceToNow(publishedAt, { 
    addSuffix: true, 
    locale: tr 
  });

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
    <article 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'overflow-hidden hover:shadow-lg transition-shadow',
        featured ? 'md:col-span-2 lg:col-span-1' : '',
        className
      )}
    >
      {news.image && (
        <div className={cn(
          'relative overflow-hidden rounded-lg',
          featured ? 'h-48 md:h-64' : 'h-40',
          isImageLoading ? 'bg-gray-200 dark:bg-gray-800' : ''
        )}>
          <Link href={`/news/${news.id}`} className="block h-full">
            {isImageLoading ? (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <OptimizedImage
                src={news.image}
                alt={news.image_title || news.seo_title || 'News image'}
                width={featured ? 800 : 400}
                height={featured ? 450 : 225}
                className={cn(
                  'w-full h-full object-cover',
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                )}
                onError={(e) => {
                  console.error('Error loading image:', news.image);
                  if (e.currentTarget) {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            )}
          </Link>
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
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

            <h3 className={cn(
              'font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2',
              featured ? 'text-lg' : 'text-base'
            )}>
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
      </div>
    </article>
  );
}
