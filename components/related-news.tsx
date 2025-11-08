'use client';

import { useEffect, useState } from 'react';
import NewsCard from '@/components/cards/NewsCard';
import type { NewsItem } from '@/types/news';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedNewsProps {
  currentSlug: string;
  className?: string;
}

export function RelatedNews({ currentSlug, className = '' }: RelatedNewsProps) {
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedNews = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/news/related?for=${encodeURIComponent(currentSlug)}&limit=3`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch related news');
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setRelatedNews(data.data);
        }
      } catch (err) {
        console.error('Error fetching related news:', err);
        setError('Failed to load related news. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSlug) {
      fetchRelatedNews();
    }
  }, [currentSlug]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Related News</h3>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (relatedNews.length === 0) {
    return null; // Don't render anything if no related news
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Related News</h3>
      <div className="grid grid-cols-1 gap-4">
        {relatedNews.map((newsItem) => (
          <NewsCard
            key={newsItem.id}
            item={newsItem}
            variant="compact"
            className="h-full"
            showCategory={true}
            showDate={true}
            showReadTime={true}
          />
        ))}
      </div>
    </div>
  );
}