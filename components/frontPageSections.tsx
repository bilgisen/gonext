'use client';

import { memo } from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

// ... (NewsCard tanımı aynı kalır) ...
interface NewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  compactTitle?: boolean;
  showDescription?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({
  item,
  className,
  showCategory = false,
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
        'group flex flex-col rounded-lg overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        'bg-card/30 text-card-foreground',
        className
      )}
    >
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

      <div className="p-4 flex-1 flex flex-col">
        {showCategory && item.category && (
          <span className="text-xs font-medium text-primary mb-2">
            {item.category}
          </span>
        )}

        {compactTitle ? (
          <h3 className="text-lg md:text-lg sm:text-xl font-medium mb-0 line-clamp-3">
            {item.seo_title}
          </h3>
        ) : (
          <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-medium mb-2 spacing-tight line-clamp-3">
            {item.seo_title}
          </h2>
        )}

        {showDescription && item.seo_description && (
          <p className="text-lg sm:text-md md:text-lg text-muted-foreground mb-3 line-clamp-4">
            {item.seo_description}
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

// Layout Türleri
type LayoutType = 'a' | 'b' | 'c';

interface FrontPageSectionProps {
  category: string;
  limit?: number;
  offset?: number;
  layoutType?: LayoutType;
  className?: string;
}

const FrontPageSection = memo<FrontPageSectionProps>(({
  category,
  limit = 5,
  offset = 0,
  layoutType = 'a',
  className = '',
}) => {
  const formatCategoryName = (cat: string) => {
    if (!cat || cat === 'all') return undefined;
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const formattedCategory = formatCategoryName(category);
  const { data, isLoading, error } = useNews({
    category: formattedCategory,
    limit,
    offset,
    sort: 'newest',
    enabled: true,
  });

  const responseData = data?.pages?.[0]?.data;
  let newsItems: NewsItem[] = [];

  if (Array.isArray(responseData?.items)) {
    newsItems = responseData.items;
  } else if (Array.isArray(responseData)) {
    newsItems = responseData;
  } else if (Array.isArray(data?.pages?.[0]?.data)) {
    newsItems = data.pages[0].data;
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Error loading news:', error);
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">
          Error loading news. Please try again later.
        </p>
      </div>
    );
  }

  if (!isLoading && (!newsItems || newsItems.length === 0)) {
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">No news available for {category}.</p>
      </div>
    );
  }

  const items = Array.isArray(newsItems) ? newsItems.slice(0, 5) : [];
  const [firstItem, secondItem, thirdItem, fourthItem, fifthItem] = items;

  let layoutContent;

  switch (layoutType) {
    case 'b':
      // 1/4 - 1/2 - 1/4
      // Bu layout'ta sadece 1 tane 1/4 sütun var (solda). 2 kartı alt alta koymak için sağ sütunu da kullanmamız gerekir.
      // Ancak soru sadece 1/4 sütunlarda 2 kart istiyor. 'b' için tek bir kartı sola koyabiliriz.
      // Eğer 'b' için de 2 kart isteniyorsa, sağ sütuna da bir kart daha eklenmeli veya yapı değiştirilmeli.
      // Mevcut yapıya göre 'b' için sadece bir 1/4 sütun var, o da solda.
      layoutContent = (
        <>
          <div className="col-span-12 md:col-span-3">
            {secondItem && (
              <NewsCard
                item={secondItem}
                showCategory={category === 'all'}
                compactTitle
                className="h-full"
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-6">
            {firstItem && (
              <NewsCard
                item={firstItem}
                showDescription
                className="h-full"
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-3">
            {thirdItem && (
              <NewsCard
                item={thirdItem}
                showCategory={category === 'all'}
                compactTitle
                className="h-full"
              />
            )}
          </div>
        </>
      );
      break;
    case 'c':
      // 1/4, 1/4, 1/2
      // Sol sütun (1/4) için: secondItem, fourthItem
      // Sağ sütun (1/4) için: thirdItem, fifthItem
      // Orta sütun (1/2) için: firstItem (ana haber)
      // Mobilde: firstItem üstte (order-1), diğerleri altta
      layoutContent = (
        <>
          {/* Ana haber - Mobilde üstte, masaüstünde sağda */}
          <div className="col-span-12 md:col-span-6 order-1 md:order-3">
            {firstItem && (
              <NewsCard
                item={firstItem}
                showDescription
                className="h-full"
              />
            )}
          </div>
          
          {/* Sol sütun - Mobilde ortada */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full order-2 md:order-1">
            {secondItem && (
              <div className="flex-1">
                <NewsCard
                  item={secondItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
            {fourthItem && (
              <div className="flex-1">
                <NewsCard
                  item={fourthItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
          </div>
          
          {/* Sağ sütun - Mobilde altta */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full order-3 md:order-2">
            {thirdItem && (
              <div className="flex-1">
                <NewsCard
                  item={thirdItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
            {fifthItem && (
              <div className="flex-1">
                <NewsCard
                  item={fifthItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
          </div>
        </>
      );
      break;
    case 'a':
    default:
      // 1/2, 1/4; 1/4 (Orijinal layout)
      // Sol sütun (1/2) için: firstItem
      // Orta sütun (1/4) için: secondItem
      // Sağ sütun (1/4) için: thirdItem
      // 1/4 sütunlarda 2 kart isteniyorsa: Orta sütun: secondItem, fourthItem. Sağ sütun: thirdItem, fifthItem.
      layoutContent = (
        <>
          <div className="col-span-12 md:col-span-6">
            {firstItem && (
              <NewsCard
                item={firstItem}
                showDescription
                className="h-full"
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
            {secondItem && (
              <div className="flex-1">
                <NewsCard
                  item={secondItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
            {fourthItem && (
              <div className="flex-1">
                <NewsCard
                  item={fourthItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
            {thirdItem && (
              <div className="flex-1">
                <NewsCard
                  item={thirdItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
            {fifthItem && (
              <div className="flex-1">
                <NewsCard
                  item={fifthItem}
                  showCategory={category === 'all'}
                  compactTitle
                  className="h-full"
                />
              </div>
            )}
          </div>
        </>
      );
  }

  return (
    <div className={cn('grid grid-cols-12 gap-6 w-full', className)}>
      {layoutContent}
    </div>
  );
});

FrontPageSection.displayName = 'FrontPageSection';

// --- FrontPageSections bileşeni ---
interface FrontPageSectionsProps {
  categories: string[];
  layout?: LayoutType | LayoutType[];
  offset?: number | number[];
  limit?: number;
}

const FrontPageSections: React.FC<FrontPageSectionsProps> = ({
  categories,
  layout = 'a',
  offset = 0,
  limit = 5,
}) => {
  const getLayoutForIndex = (index: number): LayoutType => {
    if (Array.isArray(layout)) {
      return layout[index % layout.length] || 'a';
    }
    return layout;
  };

  const getOffsetForIndex = (index: number): number => {
    if (Array.isArray(offset)) {
      return offset[index % offset.length] || 0;
    }
    return offset;
  };

  return (
    <section className="space-y-12">
      {categories.map((cat, index) => {
        const currentLayout = getLayoutForIndex(index);
        const currentOffset = getOffsetForIndex(index);

        return (
          <div key={cat} className="space-y-4">
            <h3 className="text-2xl font-semibold capitalize">{cat}</h3>
            <FrontPageSection
              category={cat}
              limit={limit}
              offset={currentOffset}
              layoutType={currentLayout}
            />
          </div>
        );
      })}
    </section>
  );
};

export default FrontPageSections;