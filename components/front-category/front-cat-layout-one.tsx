// components/FrontCategoryLayoutOne.tsx
import React, { memo } from 'react';
// dynamic import kaldırıldı
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage'; // BlobImage hala import ediliyor

// FrontCategoryFeatNewsCard içeriği buraya taşındı
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
          <h3 className="text-xl font-semibold line-clamp-3 mb-2">
            {item.seo_title || item.title}
          </h3>
        ) : (
<h2 className="text-2xl sm:text-xl md:text-2xl lg:text-4xl font-bold mb-2 spacing-tight line-clamp-3">            {item.seo_title || item.title}
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

// Ana bileşenin geri kalanı
interface FrontCategoryLayoutOneProps {
  mainCategory?: string;
  secondCategory?: string;
  thirdCategory?: string;
  fourthCategory?: string;
  fifthCategory?: string;
  className?: string;
  // Card tipleri artık FrontCategoryFeatNewsCardProps ile uyumlu olmalı
  MainCard?: React.ComponentType<FrontCategoryFeatNewsCardProps>;
  SecondCard?: React.ComponentType<FrontCategoryFeatNewsCardProps>;
  ThirdCard?: React.ComponentType<FrontCategoryFeatNewsCardProps>;
  FourthCard?: React.ComponentType<FrontCategoryFeatNewsCardProps>;
  FifthCard?: React.ComponentType<FrontCategoryFeatNewsCardProps>;
}

const FrontCategoryLayoutOne: React.FC<FrontCategoryLayoutOneProps> = memo(({
  mainCategory = 'sports',
  secondCategory = 'world',
  thirdCategory = 'business',
  fourthCategory = 'technology',
  fifthCategory = 'turkiye',
  className = '',
  MainCard = FrontCategoryFeatNewsCard, // Varsayılan kart artık entegre edilmiş olan
  SecondCard = FrontCategoryFeatNewsCard,
  ThirdCard = FrontCategoryFeatNewsCard,
  FourthCard = FrontCategoryFeatNewsCard,
  FifthCard = FrontCategoryFeatNewsCard,
}) => {
  const formatCategory = (cat: string) =>
    cat && cat !== 'all'
      ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
      : undefined;

  // Define all news queries at the top level
  const mainNews = useNews({
    category: formatCategory(mainCategory),
    limit: 1,
    sort: 'newest',
    enabled: true
  });

  const secondNews = useNews({
    category: formatCategory(secondCategory),
    limit: 1,
    sort: 'newest',
    enabled: true
  });

  const thirdNews = useNews({
    category: formatCategory(thirdCategory),
    limit: 1,
    sort: 'newest',
    enabled: true
  });

  const fourthNews = useNews({
    category: formatCategory(fourthCategory),
    limit: 1,
    sort: 'newest',
    enabled: true
  });

  const fifthNews = useNews({
    category: formatCategory(fifthCategory),
    limit: 1,
    sort: 'newest',
    enabled: true
  });

  // Combine loading and error states
  const isLoading = mainNews.isLoading || secondNews.isLoading ||
                   thirdNews.isLoading || fourthNews.isLoading ||
                   fifthNews.isLoading;

  const isError = mainNews.error || secondNews.error ||
                 thirdNews.error || fourthNews.error ||
                 fifthNews.error;

  // Extract news items
  const items = [
    mainNews.data?.pages?.[0]?.data?.items?.[0],
    secondNews.data?.pages?.[0]?.data?.items?.[0],
    thirdNews.data?.pages?.[0]?.data?.items?.[0],
    fourthNews.data?.pages?.[0]?.data?.items?.[0],
    fifthNews.data?.pages?.[0]?.data?.items?.[0]
  ];

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    );
  }

  if (isError || items.some((i) => !i)) {
    return (
      <div className={cn('rounded-lg border border-dashed p-8 text-center', className)}>
        <p className="text-muted-foreground">
          Error or insufficient news.
        </p>
      </div>
    );
  }

  const [mainItem, secondItem, thirdItem, fourthItem, fifthItem] = items;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-5 w-full', className)}>
      {/* Sol kolon - Mobilde 3. sırada */}
      <div className="md:col-span-3 flex flex-col gap-4 order-3 md:order-0">
        <MainCard item={mainItem!} showCategory compactTitle showDescription={false} className="h-full" />
        <ThirdCard item={thirdItem!} showCategory compactTitle showDescription={false} className="h-full" />
      </div>

      {/* Orta kolon - Mobilde 1. sırada (İstenen) */}
      <div className="md:col-span-6 order-1 md:order-0">
        <SecondCard item={secondItem!} showCategory showDescription compactTitle={false} className="h-full" />
      </div>

      {/* Sağ kolon - Mobilde 2. sırada */}
      <div className="md:col-span-3 flex flex-col gap-4 order-2 md:order-0">
        <FourthCard item={fourthItem!} showCategory compactTitle showDescription={false} className="h-full" />
        <FifthCard item={fifthItem!} showCategory compactTitle showDescription={false} className="h-full" />
      </div>
    </div>
  );
});

FrontCategoryLayoutOne.displayName = 'FrontCategoryLayoutOne';

export default FrontCategoryLayoutOne;