// components/front-category/front-cat-layout-one.tsx
'use client';

import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';
import { useQuery } from '@tanstack/react-query';
import { fetchNewsFromDatabase } from '@/hooks/queries/useExternalQueries';

// ... (FrontCategoryFeatNewsCard tanımı aynı) ...
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
    <div
      className={cn(
        'group flex flex-col rounded-md overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card/70 text-card-foreground',
        className
      )}
    >
      <div className="relative w-full pt-[100%] md:pt-[65%] overflow-hidden">
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
          <span className="text-sm uppercase font-medium text-primary mb-2">
            {item.category}
          </span>
        )}

        {compactTitle ? (
          <Link 
            href={`/${categorySlug}/${item.slug}`}
            className="hover:underline"
          >
            <h3 className="text-3xl sm:text-xl md:text-2xl font-medium line-height-tight line-clamp-2 mb-0">
              {item.seo_title || item.title}
            </h3>
          </Link>
        ) : (
          <Link 
            href={`/${categorySlug}/${item.slug}`}
            className="hover:underline"
          >
            <h2 className="text-4xl sm:text-xl md:text-2xl lg:text-4xl font-medium mb-2 spacing-tight">
              {item.seo_title || item.title}
            </h2>
          </Link>
        )}

        {showDescription && (item.seo_description || item.description) && (
          <p className="text-xl text-muted-foreground/90 mb-3 line-clamp-5">
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
    </div>
  );
};

// Prop type definition for the layout component
interface FrontCategoryLayoutOneProps {
  className?: string;
  initialData: {
    mainItem: NewsItem | null;
    leftItems: (NewsItem | null)[];
    rightItems: (NewsItem | null)[];
  };
}

const FrontCategoryLayoutOne = ({
  className = '',
  initialData,
}: FrontCategoryLayoutOneProps) => {
  // Ana haber (Turkey)
  const { data: mainNewsData } = useQuery({
    queryKey: ['news', { category: 'turkiye', limit: 1, sort: 'newest' }],
    queryFn: () => fetchNewsFromDatabase({ category: 'turkiye', limit: 1, sort: 'newest' }),
    staleTime: 0, // initialData ile başlatıldıktan sonra hemen yenile
    refetchInterval: 30000, // 30 saniyede bir otomatik yenile
    initialData: initialData.mainItem ? { items: [initialData.mainItem], total: 1, has_more: false, offset: 0, limit: 1 } : undefined,
    // initialDataUpdatedAt kaldırıldı
  });

  // Sol kolon (Business) - 2 haber
  const { data: leftNewsData } = useQuery({
    queryKey: ['news', { category: 'business', limit: 2, sort: 'newest' }],
    queryFn: () => fetchNewsFromDatabase({ category: 'business', limit: 2, sort: 'newest' }),
    staleTime: 0,
    refetchInterval: 30000,
    initialData: initialData.leftItems.length > 0 ? { items: initialData.leftItems.filter(Boolean) as NewsItem[], total: initialData.leftItems.length, has_more: false, offset: 0, limit: 2 } : undefined,
    // initialDataUpdatedAt kaldırıldı
  });

  // Sağ kolon (World) - 2 haber
  const { data: rightNewsData } = useQuery({
    queryKey: ['news', { category: 'world', limit: 2, sort: 'newest' }],
    queryFn: () => fetchNewsFromDatabase({ category: 'world', limit: 2, sort: 'newest' }),
    staleTime: 0,
    refetchInterval: 30000,
    initialData: initialData.rightItems.length > 0 ? { items: initialData.rightItems.filter(Boolean) as NewsItem[], total: initialData.rightItems.length, has_more: false, offset: 0, limit: 2 } : undefined,
    // initialDataUpdatedAt kaldırıldı
  });

  // Verileri uygun formatta al
  const mainItem = mainNewsData?.items?.[0] || null;
  const leftItems = leftNewsData?.items || [];
  const rightItems = rightNewsData?.items || [];

  // Eğer ana öğe yoksa, loading state göster (initialData ile başlatılmışsa bu nadiren olur)
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
        {leftItems.slice(0, 2).map((item: NewsItem | null, index: number) => (
          item ? (
            <FrontCategoryFeatNewsCard
              key={item.id || `left-${index}`}
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
        {rightItems.slice(0, 2).map((item: NewsItem | null, index: number) => (
          item ? (
            <FrontCategoryFeatNewsCard
              key={item.id || `right-${index}`}
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
};

FrontCategoryLayoutOne.displayName = 'FrontCategoryLayoutOne';

export default FrontCategoryLayoutOne;