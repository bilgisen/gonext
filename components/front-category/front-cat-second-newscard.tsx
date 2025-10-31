import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

interface FrontCategorySecondNewsCardProps {
  item: NewsItem;
  className?: string;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FrontCategorySecondNewsCard: React.FC<FrontCategorySecondNewsCardProps> = ({
  item,
  className,
  showDate = true,
  showReadTime = true,
}) => {
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() || '' : '';
  
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
  
  return (
    <Link 
      href={`/${categorySlug}/${item.slug}`}
      className={cn(
        'group flex flex-col rounded-lg overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card/20 text-card-foreground',
        className
      )}
    >
      {/* Image Container with taller height */}
      <div className="relative w-full pt-[60%] overflow-hidden">
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
      <div className="p-4 flex-1 flex flex-col">

        {/* Title */}
<h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold mb-2 line-clamp-3">          {item.seo_title}
        </h2>

        {/* Description - optional */}
        {item.seo_description && (
          <p className="text-lg sm:text-md md:text-lg text-muted-foreground mb-3 line-clamp-4">
            {item.seo_description}
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

export default FrontCategorySecondNewsCard;
