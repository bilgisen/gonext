'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  title: string;
  [key: string]: any;
}

interface TemplateWrapperProps {
  news: NewsItem;
  variant?: string;
  className?: string;
  Template: React.ComponentType<any> | React.LazyExoticComponent<React.ComponentType<any>>;
}

const TemplateWrapper = ({ 
  news, 
  variant = 'small', 
  className = '',
  Template
}: TemplateWrapperProps) => (
  <Template news={news} variant={variant} className={className} />
);

interface FrontPageCategoriesProps {
  category: string | string[];
  template: React.ComponentType<any> | React.LazyExoticComponent<React.ComponentType<any>>;
  variant?: 'large' | 'small' | 'bento' | 'grid' | 'featured';
  className?: string;
  limit?: number;
  title?: string;
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
  title,
  showTabs = true,
  allNews = [],
  isLoading = false,
  error = null,
  limit = 6 // Add default value for limit
}: FrontPageCategoriesProps) {
  const categories = Array.isArray(category) ? category : [category];
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length === 1 ? categories[0] : null
  );
  
  // Filter news based on active category if set
  const filteredNews = activeCategory 
    ? allNews.filter(news => news.category === activeCategory)
    : allNews;

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

  // Use the TemplateWrapper component that's now defined outside

  // Render the appropriate layout based on the variant
  if (filteredNews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {title || activeCategory} news found.
      </div>
    );
  }

  let content;
  
  switch (variant) {
    case 'bento':
      content = (
        <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-6', className)}>
          {filteredNews.map((news, index) => (
            <div 
              key={news.id} 
              className={cn(
                index === 0 ? 'md:col-span-2 row-span-2 h-[500px]' : 'h-48',
                index === 3 ? 'md:col-span-3 h-[300px]' : ''
              )}
            >
              <TemplateWrapper 
                news={news} 
                variant={index === 0 ? 'large' : 'small'}
                className="h-full"
                Template={Template}
              />
            </div>
          ))}
        </div>
      );
      break;
    
    case 'featured':
      content = (
        <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-6', className)}>
          <div className="md:col-span-7">
            {filteredNews[0] && (
              <TemplateWrapper 
                news={filteredNews[0]} 
                variant="large" 
                Template={Template}
                className="h-full"
              />
            )}
          </div>
          <div className="md:col-span-5 grid grid-cols-1 gap-4">
            {filteredNews.slice(1, limit).map((news) => (
              <div key={news.id} className="h-full">
                <TemplateWrapper 
                  news={news} 
                  variant="small" 
                  Template={Template}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      );
      break;
      
    case 'grid':
    default:
      content = (
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
          {filteredNews.map((news, index) => (
            <div key={news.id} className="col-span-1">
              <TemplateWrapper 
                news={news} 
                variant={index === 0 ? 'large' : 'small'}
                Template={Template}
                className="h-full"
              />
            </div>
          ))}
        </div>
      );
  }

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
      {content}
    </div>
  );
}

// Default export for backward compatibility
export default FrontPageCategories;
