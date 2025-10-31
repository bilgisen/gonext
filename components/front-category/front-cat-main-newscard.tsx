import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

interface FrontCategoryMainNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FrontCategoryMainNewsCard: React.FC<FrontCategoryMainNewsCardProps> = ({
  item,
  className = '',
  showCategory = true,
  showDate = true,
  showReadTime = true,
}) => {
  // Format the date with time, only if it's a valid and non-default date
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if the date is invalid, default (1970), or specifically January 1, 2001
      if (isNaN(date.getTime()) || 
          date.getFullYear() <= 1970 || 
          (date.getFullYear() === 2001 && date.getMonth() === 0 && date.getDate() === 1)) {
        return '';
      }
      return format(date, 'MMMM d \'at\' HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Get the category slug, ensuring it's in the correct format
  const getCategorySlug = (): string => {
    // If the category is an object with a slug property, use that
    if (item.category && typeof item.category === 'object' && 'slug' in item.category) {
      return (item.category as any).slug || 'turkiye';
    }
    // If it's a string, try to convert it to a slug
    if (typeof item.category === 'string') {
      return item.category.toLowerCase() === 'türkiye' ? 'turkiye' : item.category.toLowerCase();
    }
    // Default to 'turkiye' if no valid category is found
    return 'turkiye';
  };
  
  const categorySlug = getCategorySlug();
  
  // Try to get the most recent valid date
  const formattedDate = [
    item.published_at,
    item.created_at,
    item.updated_at
  ].reduce((result, date) => {
    if (result) return result; // If we already have a valid date, keep it
    if (!date) return '';       // Skip if date is null/undefined
    
    const d = new Date(date);
    // Only accept dates after 2001 (or any reasonable threshold)
    return (d.getFullYear() > 2001) ? formatDate(date) : '';
  }, '');
    
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() : null;

  return (
    <Link 
      href={`/${categorySlug}/${item.slug}`}
      className={cn(
        'group flex flex-col rounded-lg overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card/50 text-card-foreground',
        className
      )}
    >
      <div className="relative h-48 w-full overflow-hidden md:h-60 lg:h-72">
        {imageKey ? (
          <BlobImage
            imageKey={imageKey}
            alt={item.image_title || item.seo_title || 'News Image'}
            width={800}
            height={600}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-muted/30">
                <span className="text-muted-foreground">Image not available</span>
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-lineer-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {showCategory && item.category && (
            <span className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
              {typeof item.category === 'string' ? item.category : (item.category as any).name}
            </span>
          )}
            
            <h3 className="mb-2 line-clamp-2 text-md font-bold leading-tight text-white md:text-xl">
              {item.seo_title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              {showDate && formattedDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </div>
              )}
              
              {showReadTime && item.read_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.read_time} min</span>
                </div>
              )}
            </div>
          </div>
        </div>
    </Link>
  );
};

export default FrontCategoryMainNewsCard;
