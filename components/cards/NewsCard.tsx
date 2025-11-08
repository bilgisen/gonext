import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { Clock, Heart } from 'lucide-react';
import ShareButton from '@/components/ui/share-button';
import BookmarkButton from '@/components/BookmarkButton';
import BlobImage from '@/components/BlobImage';
import { useState } from 'react';

type CardVariant = 'medium' | 'compact';

export interface NewsCardProps {
  item: NewsItem;
  variant?: CardVariant;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  showDescription?: boolean;
  showBookmark?: boolean;
  showShare?: boolean;
  showFavorite?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({
  item,
  variant = 'medium',
  className,
  showCategory = true,
  showDate = true,
  showReadTime = true,
  showDescription = true,
  showBookmark = true,
  showShare = true,
  showFavorite = true,
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
  
  // Format the date as time ago, only if it's a valid and non-default date
  const formatTimeAgo = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if the date is invalid, default (1970), or specifically January 1, 2001
      if (isNaN(date.getTime()) || 
          date.getFullYear() <= 1970 || 
          (date.getFullYear() === 2001 && date.getMonth() === 0 && date.getDate() === 1)) {
        return '';
      }
      
      // Simple fallback format in English
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Convert to appropriate time unit
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
      if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
      return `${Math.floor(diffInSeconds / 31536000)}y`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Try to get the most recent valid date
  const timeAgo = [
    item.published_at,
    item.created_at,
    item.updated_at
  ].reduce((result, date) => {
    if (result) return result; // If we already have a valid date, keep it
    if (!date) return '';       // Skip if date is null/undefined
    
    const d = new Date(date);
    // Only accept dates after 2001 (or any reasonable threshold)
    return (d.getFullYear() > 2001) ? formatTimeAgo(date) : '';
  }, '');
  
  const [isFavorite, setIsFavorite] = useState(false);
  
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    console.log('Favorite clicked for:', item.id);
  };

  // Base card classes
  const cardClasses = cn(
    'group flex flex-col rounded-lg overflow-hidden',
    'transition-all duration-200 hover:shadow-lg',
    'bg-card/30 text-card-foreground',
    'h-full',
    className
  );

  // Image container classes based on variant
  const imageContainerClasses = cn(
    'relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800',
    variant === 'medium'
      ? 'pt-[90%] md:pt-[68%]' // 16:9 for medium
      : 'pt-[75%] md:pt-[56.25%]', // 4:3 on mobile, 16:9 on desktop for compact
  );

  // Content container classes
  const contentClasses = cn(
    'flex flex-col flex-1 p-3 md:p-4',
    variant === 'compact' ? 'p-2' : ''
  );

  // Title classes based on variant
  const titleClasses = cn(
    'font-semibold line-clamp-2',
    variant === 'medium'
      ? 'text-base sm:text-xl md:text-4xl mb-1.5'
      : 'text-md md:text-base mb-1'
  );

  // Description classes
  const descriptionClasses = cn(
    'text-muted-foreground line-clamp-3',
    variant === 'medium'
      ? 'text-md'
      : 'text-md',
    variant === 'compact' ? 'block md:hidden' : '' // Show on mobile, hide on desktop for compact
  );

  return (
    <div className={cardClasses}>
      <Link
        href={`/${categorySlug}/${item.slug}`}
        className="block h-full group"
        aria-label={`Read more about ${item.seo_title}`}
      >
        {/* Image Container */}
        <div className={imageContainerClasses}>
          {showReadTime && (
            <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.read_time || 3} min read
              </span>
            </div>
          )}

          {imageKey ? (
            <BlobImage
              imageKey={imageKey}
              alt={item.image_title || item.seo_title || 'News Image'}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              width={400}
              height={variant === 'medium' ? 225 : 300}
              sizes={
                variant === 'medium'
                  ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  : '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 400px'
              }
              loading="lazy"
              fallback={
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              }
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className={contentClasses}>
        <div className="flex-1">
          {/* Category */}
          {showCategory && item.category && (
            <Link 
              href={`/${item.category}`}
              className="text-sm font-medium text-primary hover:text-foreground transition-colors uppercase inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              {item.category}
            </Link>
          )}

          {/* Title - Wrapped in Link */}
          <Link href={`/${categorySlug}/${item.slug}`} className="hover:opacity-80 transition-opacity">
            <h2 className={titleClasses}>
              {item.seo_title}
            </h2>
          </Link>

          {/* Description */}
          {showDescription && (item.seo_description || item.tldr?.[0]) && (
            <p className={descriptionClasses}>
              {item.seo_description || item.tldr?.[0]}
            </p>
          )}
        </div>

        {/* Footer with date and actions */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between w-full">
            {showDate && timeAgo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="whitespace-nowrap">{timeAgo}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {showBookmark && (
                <BookmarkButton 
                  newsId={item.id}
                  showLabel={false}
                  className="p-1.5 text-muted-foreground hover:text-primary"
                  iconClassName="w-4 h-4"
                />
              )}

              {showShare && (
                <ShareButton
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/${categorySlug}/${item.slug}`}
                  title={item.seo_title || ''}
                  text={item.seo_description || ''}
                  className="p-1.5 text-muted-foreground hover:text-primary"
                />
              )}

              {showFavorite && (
                <button
                  onClick={handleFavorite}
                  className={`p-1.5 ${isFavorite ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
            
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
