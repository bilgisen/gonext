'use client';

import Link from 'next/link';
import { useNews } from '@/hooks/useNews';
import { NewsItem } from '@/types/news';

interface NewsListProps {
  limit?: number;
  showDate?: boolean;
  showCategory?: boolean;
  className?: string;
}

export function NewsList({
  limit = 5,
  showDate = true,
  showCategory = true,
  className = '',
}: NewsListProps) {
  const { data, isLoading, error } = useNews({
    limit,
    sort: 'newest',
  });

  // Get the first page of results
  const newsItems = data?.pages[0]?.data?.items || [];

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-5 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded">
        Error loading news. Please try again later.
      </div>
    );
  }


  if (newsItems.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400">No news found.</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {newsItems.map((item: NewsItem) => (
        <div key={item.id} className="group">
          <Link 
            href={`/haber/${item.slug}`} 
            className="block py-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:underline">
              {item.title}
            </h3>
            {(showDate || showCategory) && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
                {showCategory && item.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {item.category}
                  </span>
                )}
                {showDate && item.published_at && (
                  <time dateTime={item.published_at}>
                    {new Date(item.published_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </div>
            )}
          </Link>
        </div>
      ))}
    </div>
  );
}
