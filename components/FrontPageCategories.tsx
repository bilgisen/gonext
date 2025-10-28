'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  [key: string]: any;
}

interface NewsFilters {
  limit?: number;
  excludeId?: string | number;
  [key: string]: any;
}

interface FrontPageCategoriesProps {
  category: string | string[];
  template: React.ComponentType<any> | React.LazyExoticComponent<React.ComponentType<any>>;
  variant?: 'large' | 'small' | 'bento' | 'grid' | 'featured';
  className?: string;
  limit?: number;
  title?: string;
  filters?: any;
  showTabs?: boolean;
  allNews?: NewsItem[];
  isLoading?: boolean;
  error?: any;
}

export function FrontPageCategories({
  category,
  template: Template,
  variant = 'grid',
  className,
  limit = 6,
  title,
  filters,
  showTabs = true,
  allNews = [],
  isLoading = false,
  error = null
}: FrontPageCategoriesProps) {
  const categories = Array.isArray(category) ? category : [category];
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length === 1 ? categories[0] : null
  );
  
  // Use the provided props or default values
  const newsList = allNews || [];
  const loadingState = isLoading || false;
  const errorState = error || null;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        'grid gap-6',
        variant === 'large' ? 'grid-cols-1' : 
        variant === 'small' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
        variant === 'bento' ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-64 rounded-xl bg-muted/20 border border-border/30 animate-pulse',
              variant === 'large' ? 'md:col-span-2' : '',
              variant === 'bento' && i === 0 ? 'md:col-span-2 row-span-2' : ''
            )}
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load {title || activeCategory} news
      </div>
    );
  }

  // No news found
  if (allNews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {title || activeCategory} news found.
      </div>
    );
  }

  // Create a wrapper component to handle the template rendering
  const TemplateWrapper = ({ 
    news, 
    variant = 'small', 
    className = '' 
  }: { 
    news: NewsItem; 
    variant?: string; 
    className?: string 
  }) => {
    const Component = Template as React.ComponentType<{ 
      news: NewsItem; 
      variant?: string; 
      className?: string;
    }>;
    return <Component news={news} variant={variant} className={className} />;
  };

  // Render different layouts based on variant
  const renderLayout = () => {
    switch (variant) {
      case 'large':
        return (
          <div className={cn('grid grid-cols-1 gap-6', className)}>
            {allNews.map((news, index) => (
              <div key={news.id} className="col-span-1">
                <TemplateWrapper news={news} variant="large" />
              </div>
            ))}
          </div>
        );
      
      case 'small':
        return (
          <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
            {allNews.map((news) => (
              <div key={news.id} className="col-span-1">
                <TemplateWrapper news={news} variant="small" />
              </div>
            ))}
          </div>
        );
      
      case 'bento':
        return (
          <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
            {allNews.map((news, index) => (
              <div 
                key={news.id} 
                className={cn(
                  index === 0 ? 'md:col-span-2 row-span-2 h-[500px]' : 'h-[240px]',
                  index === 3 ? 'md:col-span-3 h-[300px]' : ''
                )}
              >
                <TemplateWrapper 
                  news={news} 
                  variant={index === 0 ? 'large' : 'small'}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        );
      
      case 'featured':
        return (
          <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-6', className)}>
            <div className="md:col-span-7">
              {allNews[0] && <TemplateWrapper news={allNews[0]} variant="large" />}
            </div>
            <div className="md:col-span-5 grid grid-cols-1 gap-4">
              {allNews.slice(1, 3).map((news) => (
                <div key={news.id} className="h-full">
                  <TemplateWrapper news={news} variant="small" />
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'grid':
      default:
        return (
          <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
            {allNews.map((news, index) => (
              <div key={news.id} className="col-span-1">
                <TemplateWrapper 
                  news={news} 
                  variant={index === 0 ? 'large' : 'small'}
                />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div>
      {categories.length > 1 && showTabs && (
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}
      <div className={cn(
        'grid gap-6',
        variant === 'large' ? 'grid-cols-1' : 
        variant === 'small' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
        variant === 'bento' ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}>
        {allNews.map((news, index) => (
          <div
            key={news.id || index}
            className={cn(
              'h-full',
              variant === 'large' ? 'md:col-span-2' : '',
              variant === 'bento' && index === 0 ? 'md:col-span-2 row-span-2' : ''
            )}
          >
            <Template news={news} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default FrontPageCategories;
