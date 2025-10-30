import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { formatNewsDate } from '@/lib/utils/date-utils';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

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

interface FeatMainNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FeatMainNewsCard: React.FC<FeatMainNewsCardProps> = ({
  item,
  className = '',
  showCategory = true,
  showDate = true,
  showReadTime = true,
}) => {
  const category = getFirstCategory(item);
  const categorySlug = category.slug;
  const formattedDate = formatNewsDate(
    'published_at' in item && item.published_at 
      ? String(item.published_at) 
      : new Date().toISOString(), 
    'dd MMM yyyy'
  );
  // Use read_time from props with fallback to 5 minutes
  const readTime = 'read_time' in item && typeof item.read_time === 'number' 
    ? item.read_time 
    : 5; // Default to 5 min if not provided
  
  const imageKey = 'image' in item && item.image 
    ? String(item.image).split('/').pop() 
    : null;
    
  const title = getNewsTitle(item);
  const slug = 'slug' in item && item.slug ? String(item.slug) : '';

  return (
    <div className={cn('group relative h-full w-full', className)}>
      <Link 
        href={`/${categorySlug}/${slug}`}
        className="block h-full rounded-lg overflow-hidden bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-gray-800"
      >
        {/* Image */}
        <div className="relative h-64 w-full overflow-hidden md:h-80">
          {imageKey ? (
            <BlobImage
              imageKey={imageKey || ''}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={800}
              height={500}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {showCategory && (
            <span className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {category.name}
            </span>
          )}
          <h3 className="mt-4 text-2xl font-bold leading-tight text-gray-900 dark:text-white">
            {title}
          </h3>
          
          {/* Meta Information */}
          {(showDate || showReadTime) && (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-200">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
              )}
              {showReadTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readTime} min read
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default FeatMainNewsCard;
