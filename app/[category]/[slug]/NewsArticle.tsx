// app/[category]/[slug]/NewsArticle.tsx

'use client';

import { format } from 'date-fns';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import BlobImage from '@/components/BlobImage';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { NewsItem } from '@/types/news';

interface NewsArticleProps {
  newsItem: NewsItem;
}

export function NewsArticle({ newsItem }: NewsArticleProps) {
  const router = useRouter();
  
  if (!newsItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
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

  // Format date for display in English with time
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) {
      console.log('No date string provided');
      return '';
    }

    try {
      const date = new Date(dateString);

      // Check if the date is valid and not the default date (January 1, 0001)
      if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
        console.log('Invalid or default date:', dateString);
        return '';
      }

      const currentYear = new Date().getFullYear();
      // Only check for obviously invalid future dates (more than 1 year in future)
      if (date.getFullYear() > currentYear + 1) {
        console.log('Suspicious future date:', date);
        return '';
      }

      // Format as "Month Day, Year at HH:MM" (e.g., "October 30, 2025 at 14:30")
      return format(date, 'MMMM d, yyyy \'at\' HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return '';
    }
  };

  // Get the most appropriate date, preferring published_at, then created_at, then updated_at
  const getBestAvailableDate = (): string | null => {
    const dates = [
      newsItem.published_at,
      newsItem.created_at,
      newsItem.updated_at,
      new Date().toISOString() // Fallback to current date if all else fails
    ];

    for (const dateStr of dates) {
      if (!dateStr) continue;
      
      const date = new Date(dateStr);
      // Accept dates between 2000 and next year
      if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() <= new Date().getFullYear() + 1) {
        return dateStr;
      }
    }
    return null;
  };

  const bestDate = getBestAvailableDate();
  const formattedDate = bestDate ? formatDate(bestDate) : '';
  
  // Debug log to check date selection
  console.log('Selected date:', {
    original: { 
      published_at: newsItem.published_at, 
      created_at: newsItem.created_at, 
      updated_at: newsItem.updated_at 
    },
    selected: bestDate,
    formatted: formattedDate || 'No valid date found'
  });

  return (
    <article className="max-w-3xl mx-auto px-0">


      {/* Article Header */}
      <header className="mb-8">
        {newsItem.category && (
          <div className="mb-4">
            <a 
              href={`/${newsItem.category.toLowerCase() === 'türkiye' ? 'turkiye' : newsItem.category.toLowerCase()}`}
              className="text-lg uppercase font-medium text-primary hover:text-foreground"
            >
              {newsItem.category.toLowerCase() === 'turkiye' || newsItem.category.toLowerCase() === 'türkiye' ? 'Türkiye' : 
               newsItem.category.toLowerCase() === 'technology' ? 'Technology' :
               newsItem.category.charAt(0).toUpperCase() + newsItem.category.slice(1)}
            </a>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">{newsItem.seo_title || 'No Title'}</h1>

        {newsItem.seo_description && (
          <h3 className="text-2xl md:xl sm:xl font-light text-muted-foreground mb-4 leading-relaxed">
            {newsItem.seo_description}
          </h3>
        )}

      
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-6 space-x-2">
          {formattedDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate.split(' at ')[0]}</span>
              <Clock className="h-4 w-4 ml-2" />
              <time dateTime={bestDate || ''}>
                {formattedDate.split(' at ')[1]}
              </time>
            </div>
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
              loading="eager"
              priority
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

      {/* Article Content */}
      <div className="prose dark:prose-invert max-w-none mb-8">
        <MarkdownRenderer>
          {newsItem.content_md || newsItem.seo_description || 'No content available'}
        </MarkdownRenderer>
      </div>

      {/* Tags Section */}
      {newsItem.tags && newsItem.tags.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {newsItem.tags
              .filter(tag => tag && typeof tag === 'string')
              .map((tag) => (
                <Link
                  key={tag}
                  href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1 hover:bg-accent transition-colors cursor-pointer rounded-md"
                >
                  {tag}
                </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
