'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import BlobImage from '@/components/BlobImage';
import { NewsItem } from '@/types/news';

interface NewsArticleProps {
  newsItem: NewsItem;
}

export function NewsArticle({ newsItem }: NewsArticleProps) {
  const router = useRouter();
  
  if (!newsItem) {
    return (
      <div className="max-w-4xl mx-auto px-0">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">News Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            News content could not be loaded.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  

  // Extract just the image key from the URL if it's a Netlify Blob URL
  const getImageKey = (url?: string | null): string => {
    if (!url) return '';

    // If it's already just a key (no slashes)
    if (!url.includes('/')) return url;

    // Extract the last part of the URL as the key
    try {
      const urlObj = new URL(url, 'http://dummy.com'); // Using dummy base URL to handle relative URLs
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1];
    } catch (error) {
      console.error('Error parsing image URL:', error);
      return '';
    }
  };

  const imageKey = newsItem.image ? getImageKey(newsItem.image) : '';

  // Format date for display in English
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';

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

      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const publishedDate = newsItem.published_at || newsItem.created_at || '';
  const formattedDate = publishedDate ? formatDate(publishedDate) : '';




  return (
    <article className="max-w-3xl mx-auto px-0">


      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">{newsItem.seo_title || 'No Title'}</h1>

        {newsItem.seo_description && (
          <h3 className="text-xl font-light text-muted-foreground mb-4 leading-relaxed">
            {newsItem.seo_description}
          </h3>
        )}

        {/* Date */}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          {formattedDate && (
            <time dateTime={publishedDate}>
              {formattedDate}
            </time>
          )}
        </div>
      </header>

      {/* Article Image */}
      {imageKey && (
        <div className="mb-8">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <BlobImage
              imageKey={imageKey}
              alt={newsItem.image_title || newsItem.seo_title || 'News Image'}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Error loading image:', newsItem.image);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          {newsItem.image_title && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              {newsItem.image_title}
            </p>
          )}
        </div>
      )}

      {/* TL;DR Section */}
      {newsItem.tldr && newsItem.tldr.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 uppercase tracking-wide">
            TL;DR
          </h3>
          <ul className="space-y-2">
            {newsItem.tldr.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-blue-700 dark:text-blue-300">
                <span className="flex w-5 h-5 bg-blue-500 text-white text-xs rounded-full items-center justify-center mr-3 mt-0.5 shrink-0">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Article Content */}
      <div className="prose dark:prose-invert max-w-none mb-8">
        <MarkdownRenderer>
          {newsItem.content_md || newsItem.seo_description || 'No content available'}
        </MarkdownRenderer>
      </div>

      {/* Tags Section */}
      {newsItem.tags && newsItem.tags.length > 0 && (
        <div className="mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {newsItem.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
