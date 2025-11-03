// components/cards/front-cat-feat-newscard.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

interface FrontCategoryFeatNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  compactTitle?: boolean;
  showDescription?: boolean;
}

const FrontCategoryFeatNewsCard: React.FC<FrontCategoryFeatNewsCardProps> = ({
  item,
  className,
  showCategory = false,
  showDate = true,
  showReadTime = true,
  compactTitle = false,
  showDescription = false,
}) => {
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() || '' : '';
  
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

  return (
    <Link 
      href={`/${categorySlug}/${item.slug}`}
      className={cn(
        'group flex flex-col rounded-md overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card/20 text-card-foreground',
        className
      )}
    >
      {/* Image Container with taller height */}
      <div className="relative w-full pt-[65%] overflow-hidden">
        {imageKey ? (
          <BlobImage
            imageKey={imageKey}
            alt={item.image_title || item.seo_title || 'News Image'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={800}
            height={400}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-muted/30">
                <span className="text-muted-foreground">Image not available</span>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 mt-0 mb-2 flex-1 flex flex-col">
        {/* Category */}
        {showCategory && item.category && (
          <span className="text-sm font-medium text-primary mb-2">
            {item.category}
          </span>
        )}

        {/* Title */}
        {compactTitle ? (
          <h3 className="text-md font-medium line-clamp-3 mb-2">
            {item.seo_title || item.title}
          </h3>
        ) : (
          <h2 className="text-2xl font-medium mb-2 line-clamp-3">
            {item.seo_title || item.title}
          </h2>
        )}

        {/* Description - optional */}
        {showDescription && (item.seo_description || item.description) && (
          <p className="text-lg text-muted-foreground/90 mb-3 line-clamp-4">
            {item.seo_description || item.description}
          </p>
        )}

        {/* Date and Read Time - Only show if we have a valid date */}
        {(showDate && formattedDate) || showReadTime ? (
          <div className="mt-auto pt-2 text-xs text-muted-foreground flex items-center gap-4">
            {showDate && formattedDate && (
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formattedDate}
              </span>
            )}
            {showReadTime && item.read_time && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {item.read_time} min read
              </span>
            )}
          </div>
        ) : null}
      </div>
    </Link>
  );
};

export default FrontCategoryFeatNewsCard;
