import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

interface FrontCategorySecondNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FrontCategorySecondNewsCard: React.FC<FrontCategorySecondNewsCardProps> = ({
  item,
  className,
  showCategory = true,
  showDate = true,
  showReadTime = true,
}) => {
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() || '' : '';
  
  // Format the date
  const formattedDate = item.published_at 
    ? format(new Date(item.published_at), 'MMMM d, yyyy')
    : '';

  return (
    <Link 
      href={`/${item.category}/${item.slug}`}
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
        {showCategory && item.category && (
          <span className="text-xs font-medium text-primary mb-2">
            {item.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-3xl font-semibold mb-2 line-clamp-2">
          {item.seo_title}
        </h3>

        {/* Description - optional */}
        {item.seo_description && (
          <p className="text-md text-muted-foreground mb-3 line-clamp-2">
            {item.seo_description}
          </p>
        )}

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

export default FrontCategorySecondNewsCard;
