// app/[category]/[slug]/NewsArticle.tsx

'use client';

import { format } from 'date-fns';
import { Clock, ArrowLeft, Heart } from 'lucide-react';
import BookmarkButton from '@/components/BookmarkButton';
import { Button } from '@/components/ui/button';
// MarkdownRenderer is no longer needed as we're using pre-rendered HTML
import ShareButton from '@/components/ui/share-button';
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
      // Parse the date string - the server sends dates in UTC
      const date = new Date(dateString);
      
      // Check if the date is valid and not the default date (January 1, 0001)
      if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
        console.log('Invalid or default date:', dateString);
        return '';
      }

      // Format as "Month Day, Year at HH:MM" (e.g., "October 30, 2025 at 14:30")
      // Use the UTC methods to avoid timezone conversion
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      
      // Create a new date object with the UTC values to avoid timezone issues
      const utcDate = new Date(Date.UTC(year, month, day, hours, minutes));
      
      // Format the date using the local timezone for display
      return format(utcDate, 'MMMM d, yyyy \'at\' HH:mm');
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
      newsItem.updated_at
    ].filter(Boolean); // Remove any null/undefined values

    for (const dateStr of dates) {
      if (!dateStr) continue;
      
      // Skip if it's a default/zero date
      if (dateStr.startsWith('0001-01-01')) continue;
      
      const date = new Date(dateStr);
      
      // Check if the date is valid and within a reasonable range
      if (!isNaN(date.getTime()) && 
          date.getFullYear() > 2000 && 
          date.getFullYear() <= new Date().getFullYear() + 1) {
        return dateStr;
      }
    }
    
    // If no valid date found in the item, use current date as fallback
    return new Date().toISOString();
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
    <article className="max-w-2xl mx-auto px-0">


      {/* Article Header */}
      <header className="mb-8">
        {newsItem.category && (
          <div className="mb-4">
            <a 
              href={`/${newsItem.category.toLowerCase() === 'türkiye' ? 'turkiye' : newsItem.category.toLowerCase()}`}
              className="text-md uppercase font-medium text-primary hover:text-foreground"
            >
              {newsItem.category.toLowerCase() === 'turkiye' || newsItem.category.toLowerCase() === 'türkiye' ? 'Türkiye' : 
               newsItem.category.toLowerCase() === 'technology' ? 'Technology' :
               newsItem.category.charAt(0).toUpperCase() + newsItem.category.slice(1)}
            </a>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl sm:text-2xl font-medium tracking-tight mb-4">{newsItem.seo_title || 'No Title'}</h1>

        {newsItem.seo_description && (
          <p className="text-xl text-muted-foreground mb-4">{newsItem.seo_description}</p>
        )}


      
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
        {formattedDate && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button className="p-0.5 text-muted-foreground hover:text-primary transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <BookmarkButton 
            newsId={newsItem.id} 
            showLabel={false}
            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
            iconClassName="w-4 h-4"
          />
          <ShareButton 
            url={`${typeof window !== 'undefined' ? window.location.href : ''}`}
            title={newsItem.seo_title || newsItem.title || ''}
            text={newsItem.seo_description || ''}
            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
            iconClassName="w-4 h-4"
          />
        </div>
      </div>
      </header>

      {/* Article Image */}
      {imageKey && (
        <div className="mb-8">
          <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden">
            <BlobImage
              imageKey={imageKey}
              alt={newsItem.image_title || newsItem.seo_title || 'News Image'}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
              loading="eager"
              onError={(e) => {
                console.error('Error loading image:', newsItem.image);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        
        </div>
      )}

      {/* Article Content */}
      <div className="prose dark:prose-invert max-w-none text-md mb-8">
        {newsItem.content_html || newsItem.content ? (
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: newsItem.content_html || newsItem.content || '' 
            }} 
          />
        ) : (
          <p>{newsItem.seo_description || 'No content available'}</p>
        )}
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
