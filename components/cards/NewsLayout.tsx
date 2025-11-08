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
      {sideNews.map((newsItem) => (
        <div key={newsItem.id} className="flex-1">
          <NewsCard
            item={newsItem}
            variant="compact"
            className="h-full/90"
            showCategory={showCategory}
            showDate={showDate}
            showReadTime={showReadTime}
            showDescription={true}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('flex flex-col lg:grid lg:grid-cols-3 gap-6', className)}>
      {/* Variant A: Main card on left, side cards on right */}
      {isVariantA && (
        <>
          <div className="lg:col-span-2">{mainCard}</div>
          <div className="lg:col-span-1">{sideCards}</div>
        </>
      )}

      {/* Variant B: Side cards on left (desktop), main card on right (desktop) */}
      {isVariantB && (
        <>
          {/* Main card - first on mobile, right side on desktop */}
          <div className="lg:col-span-2 lg:col-start-2">
            {mainCard}
          </div>
          
          {/* Side cards - second on mobile, left side on desktop */}
          <div className="lg:row-start-1 lg:col-start-1 lg:row-span-2">
            {sideCards}
          </div>
        </>
      )}
    </div>
  );
}

export default NewsLayout;