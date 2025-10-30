'use client';

import React, { useMemo } from 'react';
import { useNews } from '@/hooks/useNews';
import Link from 'next/link';

type Category = {
  name: string;
  slug: string;
};

type Image = {
  url: string;
  alt?: string;
};

export interface NewsItem {
  id: string | number;
  title: string;
  excerpt?: string;
  category?: Category;
  image?: Image;
  publishedAt: string;
  url?: string;
  slug?: string;
  author?: string;
  readTime?: string;
}

interface FrontFeatProps {
  className?: string;
  limit?: number;
  showCategory?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  variant?: 'default' | 'minimal' | 'featured';
}

const FrontFeat: React.FC<FrontFeatProps> = ({
  className = '',
  limit = 4,
  showCategory = true,
  showExcerpt = true,
  showDate = true,
  variant = 'default',
}) => {
  // Fetch news data with error boundaries and loading states
  const { data, isLoading, error } = useNews({
    limit,
    sort: 'newest',
    category: 'all', // Fetch all categories for front page
  });
  
  // Process news items from API response
  const newsItems = useMemo<NewsItem[]>(() => {
    if (!data) return [];
    
    try {
      // Handle both array response and paginated response
      let items: any[] = [];
      
      if (Array.isArray(data)) {
        items = data;
      } else if (data.pages && Array.isArray(data.pages)) {
        items = data.pages.flatMap(page => {
          if (Array.isArray(page)) return page;
          if (page?.data?.items) return page.data.items;
          if (page?.data) return Array.isArray(page.data) ? page.data : [];
          return [];
        });
      }
      
      return items.map((item: any, index: number) => {
        const stableId = item.id || `item-${index}`;
        const title = item.title || item.headline || 'No title available';
        const excerpt = item.excerpt || item.description || '';
        const slug = item.slug || item.id || String(index);
        
        return {
          id: stableId,
          title,
          excerpt,
          category: item.category || { 
            name: item.categoryName || 'General', 
            slug: item.categorySlug || 'general' 
          },
          image: item.image || item.coverImage || {
            url: item.imageUrl || '/images/placeholder-news.jpg',
            alt: title,
          },
          publishedAt: item.publishedAt || item.published_date || item.date || new Date().toISOString(),
          url: item.url || `/news/${slug}`,
          slug,
          author: item.author?.name || item.author || 'Anonymous',
          readTime: item.readTime || `${Math.ceil((excerpt.split(' ').length || 150) / 200)} min read`,
        };
      });
    } catch (err) {
      console.error('Error processing news items:', err);
      return [];
    }
  }, [data]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-6 ${variant === 'featured' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="space-y-3">
          </div>
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    console.error('Error loading news:', error);
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 mt-3 text-lg font-semibold text-red-800 dark:text-red-200">Error Loading News</h2>
        <p className="text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'An unknown error occurred while loading the news.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:ring-offset-gray-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get the first N news items that have required fields
  const displayItems = newsItems
    .filter(item => item?.title && item?.id) // Only include items with title and id
    .slice(0, limit);

  // If no items to display
  if (displayItems.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-gray-100">No news found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Check back later for updates.</p>
      </div>
    );
  }


  return (
    <div className={className}>
      <div className={`grid grid-cols-1 gap-6 ${
        variant === 'featured' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {displayItems.map((item, index) => {
          const isFeatured = variant === 'featured' && index === 0;
          
          return (
            <article 
              key={`news-${item.id}`} 
              className={`group flex flex-col h-full ${
                isFeatured ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex flex-col h-full overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-gray-800">
                {item.image?.url && (
                  <div className={`relative overflow-hidden ${isFeatured ? 'h-80' : 'h-48'}`}>
                    <Link href={item.url || '#'}>
                      <img
                        src={item.image.url}
                        alt={item.image.alt || item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading={index > 1 ? 'lazy' : 'eager'}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    {showCategory && item.category && (
                      <Link 
                        href={`/category/${item.category.slug || 'all'}`}
                        className="absolute top-4 left-4 z-10 inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                      >
                        {item.category.name}
                      </Link>
                    )}
                  </div>
                )}
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex-1">
                    <h3 className={`font-bold ${
                      isFeatured ? 'text-2xl' : 'text-xl'
                    } leading-tight text-gray-900 dark:text-white`}>
                      <Link 
                        href={item.url || `/${item.slug || item.id || '#'}`} 
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.title}
                      </Link>
                    </h3>
                    
                    {showExcerpt && item.excerpt && (
                      <p className={`mt-3 ${
                        isFeatured ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.excerpt.length > (isFeatured ? 200 : 100)
                          ? `${item.excerpt.substring(0, isFeatured ? 200 : 100)}...`
                          : item.excerpt
                        }
                      </p>
                    )}
                  </div>
                  
                  {(showDate || item.author) && (
                    <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {showDate && item.publishedAt && (
                        <time dateTime={item.publishedAt}>
                        </time>
                      )}
                      {item.author && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{item.author}</span>
                        </>
                      )}
                      {item.readTime && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{item.readTime}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

// Add display name
FrontFeat.displayName = 'FrontFeat';

export default FrontFeat;