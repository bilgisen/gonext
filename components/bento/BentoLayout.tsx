// components/bento/BentoLayout.tsx
import { useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import NewsCard from './NewsCard';
import type { NewsItem } from '@/types/news';

interface LayoutClasses {
  container: string;
  left: string;
  middle: string;
  right: string;
  grid: string;
  middleCard: string;
  rightCard: string;
}

interface BentoLayoutProps {
  items: NewsItem[];
  layout?: 'a' | 'b' | 'c';
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const BentoLayout = ({
  items,
  layout = 'a',
  className = '',
  showCategory = false,
  showDate = false,
  showReadTime = true,
}: BentoLayoutProps) => {
  const layoutClasses = useMemo((): LayoutClasses => {
    switch (layout) {
      case 'b':
        // Layout B: 6-3-3 layout (main on left, then two side columns)
        return {
          container: 'grid-cols-12',
          grid: 'grid grid-cols-12 gap-4 h-full',
          left: 'col-span-6',
          middle: 'col-span-3',
          right: 'col-span-3 grid grid-rows-4 gap-4',
          middleCard: 'h-1/2',
          rightCard: 'h-full'
        };
      case 'c':
        // Layout C: 3-3-6 layout (two side columns, then main on right)
        return {
          container: 'grid-cols-12',
          grid: 'grid grid-cols-12 gap-4 h-full',
          left: 'col-span-3 grid grid-rows-4 gap-4',
          middle: 'col-span-3',
          right: 'col-span-6',
          middleCard: 'h-1/2',
          rightCard: 'h-full'
        };
      default: // case 'a'
        // Layout A: 3-6-3 layout (left: 3/12, middle: 6/12, right: 3/12)
        return {
          container: 'grid-cols-12',
          grid: 'grid grid-cols-12 gap-4 h-full',
          left: 'col-span-3 flex flex-col gap-4',
          middle: 'col-span-6',
          right: 'col-span-3 grid grid-rows-4 gap-4',
          middleCard: 'h-full',
          rightCard: 'h-full'
        };
    }
  }, [layout]);

  // Handle cases with fewer than 7 items
  if (items.length < 7) {
    // For 1-3 items, show a simple grid
    if (items.length <= 3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              size="medium"
              showCategory={showCategory}
              showDate={showDate}
              showReadTime={showReadTime}
            />
          ))}
        </div>
      );
    }
    
    // For 4-6 items, show a 2-column layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <NewsCard
            key={item.id}
            item={item}
            size={index === 0 ? 'large' : 'medium'}
            showCategory={showCategory}
            showDate={showDate}
            showReadTime={showReadTime}
          />
        ))}
      </div>
    );
  }

  // For 7+ items, show the full bento layout
  const [left1, left2, middle, ...rightItems] = items;
  const rightCards = rightItems.slice(0, 4); // Take up to 4 items for the right column

  return (
    <div className={cn(layoutClasses.grid, className)}>
      {/* Left Column (3/12) - 2 medium cards */}
      <div className={layoutClasses.left}>
        <NewsCard
          item={left1}
          className={layoutClasses.middleCard}
          size="medium"
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
        />
        <NewsCard
          item={left2}
          className={layoutClasses.middleCard}
          size="medium"
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
        />
      </div>

      {/* Middle Column (6/12) - 1 large card with description */}
      <div className={layoutClasses.middle}>
        <NewsCard
          item={middle}
          className="h-full"
          size="large"
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
        />
      </div>

      {/* Right Column (3/12) - 4 small cards */}
      <div className={layoutClasses.right}>
        {rightCards.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            className={layoutClasses.rightCard}
            size="small"
            showCategory={showCategory}
            showDate={showDate}
            showReadTime={false}
          />
        ))}
      </div>
    </div>
  );
};

BentoLayout.displayName = 'BentoLayout';

export default memo(BentoLayout);