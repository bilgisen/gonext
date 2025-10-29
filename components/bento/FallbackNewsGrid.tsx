// components/bento/FallbackNewsGrid.tsx
import { memo } from 'react';
import { cn } from '@/lib/utils';
import NewsCard from './NewsCard';
import type { NewsItem } from '@/types/news';

interface FallbackNewsGridProps {
  items: NewsItem[];
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FallbackNewsGrid = ({
  items,
  className = '',
  showCategory = false,
  showDate = false,
  showReadTime = false,
}: FallbackNewsGridProps) => {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No news available.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {items.map(item => (
        <NewsCard
          key={item.id}
          item={item}
          className="h-full"
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
        />
      ))}
    </div>
  );
};

FallbackNewsGrid.displayName = 'FallbackNewsGrid';

export default memo(FallbackNewsGrid);