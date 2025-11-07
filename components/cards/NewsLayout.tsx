import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import NewsCard from './NewsCard';

type LayoutVariant = 'a' | 'b';

export interface NewsLayoutProps {
  mainNews: NewsItem;
  sideNews: [NewsItem, NewsItem];
  variant?: LayoutVariant;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  showDescription?: boolean;
}

export function NewsLayout({
  mainNews,
  sideNews,
  variant = 'a',
  className,
  showCategory = true,
  showDate = true,
  showReadTime = true,
  showDescription = true,
}: NewsLayoutProps) {
  const isVariantA = variant === 'a';
  const isVariantB = variant === 'b';

  const mainCard = (
    <NewsCard
      item={mainNews}
      variant="medium"
      className="h-full"
      showCategory={showCategory}
      showDate={showDate}
      showReadTime={showReadTime}
      showDescription={showDescription}
    />
  );

  const sideCards = (
    <div className="flex flex-col gap-4 h-full">
      {sideNews.map((newsItem ) => (
        <NewsCard
          key={newsItem.id}
          item={newsItem}
          variant="compact"
          className="flex-1"
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
          showDescription={false}
        />
      ))}
    </div>
  );

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      {/* Variant A: Main card on left, side cards on right */}
      {isVariantA && (
        <>
          <div className="lg:col-span-2">{mainCard}</div>
          <div className="lg:col-span-1">{sideCards}</div>
        </>
      )}

      {/* Variant B: Side cards on left, main card on right */}
      {isVariantB && (
        <>
          <div className="lg:col-span-1">{sideCards}</div>
          <div className="lg:col-span-2">{mainCard}</div>
        </>
      )}
    </div>
  );
}

export default NewsLayout;