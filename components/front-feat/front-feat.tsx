'use client';

import React, { useMemo } from 'react';
import { useNews } from '@/hooks/useNews';
// FeatMainNewsCard import removed as it's no longer used

interface NewsItem {
  id: string | number;
  title: string;
  excerpt?: string;
  category?: {
    name: string;
    slug: string;
  };
  image?: {
    url: string;
    alt?: string;
  };
  publishedAt: string;
  url?: string;
  [key: string]: any;
}

interface FrontFeatProps {
  className?: string;
  limit?: number;
}

const FrontFeat: React.FC<FrontFeatProps> = ({ className = '', limit = 2 }) => {
  // Fetch news data with default category
  const { data, isLoading, error } = useNews({
    limit,
    sort: 'newest',
    category: 'world', // Default to world news
  });
  
  // Process news items from API response
  const newsItems = useMemo<NewsItem[]>(() => {
    if (!data) return [];
    
    // Handle both array response and paginated response
    let items: any[] = [];
    
    if (Array.isArray(data)) {
      items = data;
    } else if (data.pages && Array.isArray(data.pages)) {
      items = data.pages.flatMap(page => {
        if (Array.isArray(page)) return page;
        if (page.data && Array.isArray(page.data)) return page.data;
        return [];
      });
    }
    
    return items.map((item: any, index: number) => {
      // Generate a stable ID based on index and item properties
      const stableId = item.id || `item-${index}-${item.title?.toString().substring(0, 20).replace(/\s+/g, '-') || index}`;
      
      return {
        id: stableId,
      title: item.title || 'No title available',
      excerpt: item.excerpt || item.description || '',
      category: item.category || { name: 'World', slug: 'world' },
      image: item.image || item.coverImage || {
        url: item.imageUrl || '/images/placeholder-news.jpg',
        alt: item.title || 'News image'
      },
      publishedAt: item.publishedAt || item.date || new Date().toISOString(),
      url: item.url || (item.slug ? `/news/${item.slug}` : '#')
    };
    });
  }, [data]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Loading featured news...</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    console.error('Error loading news:', error);
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <h2 className="mb-2 text-xl font-bold">Error Loading News</h2>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
        <p className="mt-2 text-sm">Please try refreshing the page or contact support if the problem persists.</p>
      </div>
    );
  }
  
  // Debug log
  if (newsItems.length > 0) {
    console.log('Displaying news items:', newsItems);
  }

  // Get the first N news items that have required fields
  const displayItems = newsItems
    .filter(item => item.title && item.id) // Only include items with title and id
    .slice(0, limit);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayItems.map((item) => (
          <article key={`news-${item.id}`} className="group">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:bg-gray-800">
              {item.image?.url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image.url}
                    alt={item.image.alt || item.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                {item.category && (
                  <span className="mb-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
                    {item.category.name}
                  </span>
                )}
                <h3 className="mb-2 text-xl font-bold">
                  <a 
                    href={item.url} 
                    className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {item.title}
                  </a>
                </h3>
                {item.excerpt && (
                  <p className="mb-3 text-gray-600 dark:text-gray-300">
                    {item.excerpt.length > 100 
                      ? `${item.excerpt.substring(0, 100)}...`
                      : item.excerpt
                    }
                  </p>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(item.publishedAt)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

// Add display name
FrontFeat.displayName = 'FrontFeat';

export default FrontFeat;