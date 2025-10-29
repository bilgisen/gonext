'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
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
  const [news] = useState<NewsItem>({
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
  
  const [isImageLoading] = useState(false);

  // Extract just the image key from the URL if it's a Netlify Blob URL
  const getImageKey = (url: string) => {
    if (!url) return '';
    
    // If it's already just a key (no slashes)
    if (!url.includes('/')) return url;
    
    // Extract the last part of the URL as the key
    const urlObj = new URL(url, 'http://dummy.com'); // Using dummy base URL to handle relative URLs
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  const imageKey = news.image ? getImageKey(news.image) : '';

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '';
      }

      // Check if it's a default date (like 2001-01-01)
      if (date.getFullYear() < 2020) {
        return '';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <article 
      className={cn(
        'bg-card rounded-lg border border-border',
        'overflow-hidden hover:shadow-lg transition-shadow',
        featured ? 'md:col-span-2 lg:col-span-1' : '',
        className
      )}
    >
      {imageKey && (
        <div className={cn(
          'relative overflow-hidden rounded-lg',
          featured ? 'h-36 md:h-52' : 'h-40',
          isImageLoading ? 'bg-gray-200 dark:bg-gray-800' : ''
        )}>
          <Link href={`/news/${news.id}`} className="block h-full">
            {isImageLoading ? (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <BlobImage
                imageKey={imageKey}
                alt={news.image_title || news.seo_title || 'News image'}
                width={featured ? 800 : 400}
                height={featured ? 600 : 255}
                className={cn(
                  'w-full h-full object-cover',
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                )}
                sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 33vw'}
                onError={() => {
                  console.error('Error loading image with key:', imageKey);
                }}
              />
            )}
          </Link>
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          {showCategory && (
            <div className="absolute top-3 left-3 bg-primary/50 text-background rounded">
              <span className="px-2 py-1 text-xs rounded">
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
