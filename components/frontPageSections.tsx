// components/frontPageSections.tsx
'use client';

import { memo } from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, Heart, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import BlobImage from '@/components/BlobImage';
// Paylaşım butonunuzun doğru dosya yoluna göre import edilmesi gerekiyor
// Örneğin, yukarıda oluşturduğumuz gibi components/ui/ShareButton.tsx ise:
import ShareButton from '@/components/ui/share-button'; // veya doğru yol

// ... (NewsCard tanımı) ...
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
  showDescription = true,
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

  // Paylaşılacak tam URL
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/${categorySlug}/${item.slug}`;

  return (
    <div
      className={cn(
        'relative group flex flex-col rounded-md overflow-hidden',
        'bg-linear-to-b from-card to-card/20',
        'border border-border/50 transition-all duration-200 hover:shadow-md',
        'mb-0',
        className
      )}
    >
      {/* --- Image with Read Time --- */}
      <div className="relative w-full pt-[75%] md:pt-[56.25%] overflow-hidden z-10">
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

        {/* Read Time Badge */}
        {showReadTime && item.read_time && (
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{item.read_time} min</span>
          </div>
        )}
      </div>

      {/* --- Content --- */}
      <div className="relative z-10 p-4 flex-1 flex flex-col">
        {/* Moved Time to Top */}
        {showDate && formattedDate && (
          <div className="mb-1">
            <span className="text-xs text-muted-foreground/80">
              ~{formatDistanceToNow(new Date(item.published_at || item.created_at || item.updated_at || new Date()), {
                addSuffix: true,
                includeSeconds: false
              }).replace('about ', '')}
            </span>
          </div>
        )}

        {showCategory && item.category && (
          <span className="text-sm uppercase font-medium text-primary mb-1">
            {item.category}
          </span>
        )}

        {compactTitle ? (
          <Link href={`/${categorySlug}/${item.slug}`} className="hover:underline">
            <h3 className="text-2xl sm:text-xl md:text-xl font-medium line-height-tight line-clamp-2">
              {item.seo_title || item.title}
            </h3>
            {showDescription && (item.seo_description || item.description) && compactTitle && (
              <p className="text-xl mt-2 text-muted-foreground/90 line-clamp-5 md:hidden">
                {item.seo_description || item.description}
              </p>
            )}
          </Link>
        ) : (
          <Link href={`/${categorySlug}/${item.slug}`} className="hover:underline">
            <h2 className="text-3xl py-1 sm:text-xl md:text-2xl lg:text-4xl font-medium mb-2 spacing-tight">
              {item.seo_title || item.title}
            </h2>
          </Link>
        )}

        {showDescription && (item.seo_description || item.description) && !compactTitle && (
          <p className="text-xl text-muted-foreground/90 mb-3 line-clamp-5">
            {item.seo_description || item.description}
          </p>
        )}

        {/* Buttons - Moved to bottom left */}
        <div className="mt-auto pt-2 border-t border-border/20">
          <div className="flex items-center gap-3 text-muted-foreground/80">
            <button
              type="button"
              className="p-1 rounded-full hover:text-primary transition-colors"
              aria-label="Like"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 rounded-full hover:text-primary transition-colors"
              aria-label="Save"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            {/* ShareButton prop hatası düzeltildi */}
            <ShareButton
              url={shareUrl}
              title={item.seo_title || item.title || ''}
              text={item.seo_description || item.description || ''}
              className="p-1 hover:text-primary transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
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
      layoutContent = (
        <>
          <div className="col-span-12 md:col-span-3">
            {secondItem && (
              <NewsCard
                item={secondItem}
                showCategory={category === 'all'}
                showDescription
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
                showDescription
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
      // Ana haber - Mobilde üstte (order-1), masaüstünde sağda (md:order-3)
      // Sol sütun - Mobilde ortada (order-2), masaüstünde solda (md:order-1)
      // Sağ sütun - Mobilde altta (order-3), masaüstünde ortada (md:order-2)
      layoutContent = (
        <>
          {/* Ana haber */}
          <div className="col-span-12 md:col-span-6 order-1 md:order-3">
            {firstItem && (
              <NewsCard
                item={firstItem}
                showDescription
                className="h-full"
              />
            )}
          </div>

          {/* Sol sütun */}
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

          {/* Sağ sütun */}
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
      // 1/2, 1/4; 1/4
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
            <div className="mb-6 pt-0 border-t border-card-foreground/10 w-full"></div>
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