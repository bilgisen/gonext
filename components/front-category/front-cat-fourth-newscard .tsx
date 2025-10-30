import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

interface FrontCategoryFourthNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  category?: string; // Add category prop
}

const FrontCategoryFourthNewsCard: React.FC<FrontCategoryFourthNewsCardProps> = ({
  item,
  className,
  showCategory = true,
  showDate = true,
  showReadTime = true,
  category: propCategory, // Get category from props
}) => {
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() || '' : '';
  
  // Use prop category if provided, otherwise fall back to item.category
  const displayCategory = propCategory || item.category;
  
  // Format the date
  const formattedDate = item.published_at 
    ? format(new Date(item.published_at), 'MMMM d, yyyy')
    : '';

  return (
    <Link 
      href={`/${displayCategory}/${item.slug}`}
      className={cn(
        'group flex flex-col rounded-lg overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card text-card-foreground',
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
        {/* Category */}
        {showCategory && displayCategory && (
          <span className="text-xs font-medium text-primary mb-2">
            {displayCategory}
          </span>
        )}

        {/* Title */}
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
          {item.seo_title}
        </h3>

        

        {/* Date and Read Time */}
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
      </div>
    </Link>
  );
};

export default FrontCategoryFourthNewsCard;
