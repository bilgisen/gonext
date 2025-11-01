// components/FrontCategoryLayoutOne.tsx
import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

// FrontCategoryFeatNewsCard içeriği burada tanımlanıyor
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
  showCategory = true,
  showDate = true,
  showReadTime = true,
  compactTitle = false,
  showDescription = false,
}) => {
  const imageKey = item.image ? item.image.split('/').pop() || '' : '';

  const getCategorySlug = (): string => {
    if (item.category && typeof item.category === 'object' && 'slug' in item.category) {
      return (item.category as any).slug || 'turkiye';
    }
    if (typeof item.category === 'string') {
      return item.category.toLowerCase() === 'türkiye' ? 'turkiye' : item.category.toLowerCase();
    }
    return 'turkiye';
  };

  const categorySlug = getCategorySlug();

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
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

  const formattedDate = [
    item.published_at,
    item.created_at,
    item.updated_at
  ].reduce((result, date) => {
    if (result) return result;
    if (!date) return '';
    const d = new Date(date);
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

      <div className="p-4 mt-0 mb-0 flex-1 flex flex-col">
        {showCategory && item.category && (
          <span className="text-sm font-medium text-primary mb-0">
            {item.category}
          </span>
        )}

        {compactTitle ? (
          <h3 className="text-lg font-medium line-height-tight line-clamp-2 mb-0">
            {item.seo_title || item.title}
          </h3>
        ) : (
          <h2 className="text-3xl sm:text-xl md:text-2xl lg:text-4xl font-bold mb-2 spacing-tight line-clamp-3">
            {item.seo_title || item.title}
          </h2>
        )}

        {showDescription && (item.seo_description || item.description) && (
          <p className="text-lg text-muted-foreground/90 mb-3 line-clamp-4">
            {item.seo_description || item.description}
          </p>
        )}

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

// Prop type definition for the layout component
interface FrontCategoryLayoutOneProps {
  className?: string;
  initialData: {
    mainItem: NewsItem | null;
    leftItems: (NewsItem | null)[]; // Now accepts an array of items for the left column
    rightItems: (NewsItem | null)[]; // Now accepts an array of items for the right column
  };
}

const FrontCategoryLayoutOne: React.FC<FrontCategoryLayoutOneProps> = memo(({
  className = '',
  initialData,
}) => {
  const { mainItem, leftItems, rightItems } = initialData;

  // Eğer ana öğe yoksa, loading veya error state göster
  if (!mainItem) {
    return (
      <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
        <p className="text-muted-foreground text-center py-4">Loading initial content...</p>
        {/* veya skeleton loader */}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-5 w-full', className)}>
      {/* Sol kolon - Mobilde 2. sırada */}
      <div className="md:col-span-3 flex flex-col gap-4 order-2 md:order-0">
        {leftItems.slice(0, 2).map((item, index) => (
          item ? (
            <FrontCategoryFeatNewsCard
              key={item.id || index}
              item={item}
              showCategory
              compactTitle
              showDescription={false}
              className="h-full"
            />
          ) : null
        ))}
      </div>

      {/* Orta kolon - Mobilde 1. sırada (Main) */}
      <div className="md:col-span-6 order-1 md:order-0">
        {mainItem && (
          <FrontCategoryFeatNewsCard
            item={mainItem}
            showCategory
            showDescription
            compactTitle={false}
            className="h-full"
          />
        )}
      </div>

      {/* Sağ kolon - Mobilde 3. sırada */}
      <div className="md:col-span-3 flex flex-col gap-4 order-3 md:order-0">
        {rightItems.slice(0, 2).map((item, index) => (
          item ? (
            <FrontCategoryFeatNewsCard
              key={item.id || index}
              item={item}
              showCategory
              compactTitle
              showDescription={false}
              className="h-full"
            />
          ) : null
        ))}
      </div>
    </div>
  );
});

FrontCategoryLayoutOne.displayName = 'FrontCategoryLayoutOne';

export default FrontCategoryLayoutOne;