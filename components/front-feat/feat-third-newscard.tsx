// feat-third-newscard.tsx
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { formatNewsDate } from '@/lib/utils/date-utils';
import { Calendar } from 'lucide-react';

// Helper to safely get the title from news item
const getNewsTitle = (item: NewsItem): string => {
  if (item && typeof item === 'object') {
    if ('title' in item && typeof item.title === 'string') return item.title;
    if ('name' in item && typeof item.name === 'string') return item.name;
    if ('headline' in item && typeof item.headline === 'string') return item.headline;
  }
  return 'Untitled';
};

// Helper to safely get the first category
const getFirstCategory = (item: NewsItem) => {
  if (!item.categories || !Array.isArray(item.categories) || item.categories.length === 0) {
    return { name: 'General', slug: 'general' };
  }
  
  const firstCategory = item.categories[0];
  if (typeof firstCategory === 'string') {
    return { name: firstCategory, slug: firstCategory.toLowerCase() };
  }
  
  return firstCategory || { name: 'General', slug: 'general' };
};

interface FeatThirdNewsCardProps {
  items: NewsItem[];
  className?: string;
  showDate?: boolean;
}

const FeatThirdNewsCard: React.FC<FeatThirdNewsCardProps> = ({
  items = [],
  className = '',
  showDate = true,
}) => {
  if (!items.length) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => {
        const title = getNewsTitle(item);
        const category = getFirstCategory(item);
        const formattedDate = formatNewsDate(
          'published_at' in item && item.published_at 
            ? String(item.published_at) 
            : new Date().toISOString(), 
          'dd MMM yyyy'
        );
        const slug = 'slug' in item && item.slug ? String(item.slug) : '';

        return (
          <div key={index} className="group relative">
            <Link 
              href={`/${category.slug}/${slug}`}
              className="flex items-start gap-3 transition-colors hover:text-primary"
            >
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {index + 1}
              </span>
              <div>
                <h3 className="line-clamp-2 font-medium leading-tight">
                  {title}
                </h3>
                {showDate && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default FeatThirdNewsCard;