// components/frontPageSections.tsx
'use client';

import { memo, useMemo } from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import NewsLayout from './cards/NewsLayout';

type LayoutVariant = 'a' | 'b';

interface FrontPageSectionProps {
  category: string;
  limit?: number;
  offset?: number;
  layoutVariant?: LayoutVariant;
  className?: string;
}

const FrontPageSection = memo<FrontPageSectionProps>(({
  category,
  limit = 3,
  offset = 0,
  layoutVariant,
  className,
}) => {
  const formatCategoryName = (cat: string) => {
    return cat.toLowerCase() === 'türkiye' ? 'turkiye' : cat.toLowerCase();
  };

  const formattedCategory = formatCategoryName(category);
  const { data, isLoading, error } = useNews({
    category: formattedCategory,
    limit,
    offset: offset || 0, // Ensure offset is always a number
    sort: 'newest',
  });
  
  const currentVariant = layoutVariant || 'a';
  const layoutGroup = useMemo(() => {
    const defaultGroup = {
      main: {} as NewsItem,
      side: [{} as NewsItem, {} as NewsItem] as [NewsItem, NewsItem],
      variant: 'a' as const
    };

    if (!data?.pages?.[0]?.data?.items?.length) return defaultGroup;

    const items = data.pages[0].data.items as NewsItem[];
    const mainItems = items.slice(0, 3);
    
    // Ensure we always have exactly 2 items for the side
    const getSideItems = (): [NewsItem, NewsItem] => {
      if (mainItems.length >= 3) return [mainItems[1], mainItems[2]];
      if (mainItems.length === 2) return [mainItems[1], mainItems[1]];
      return [mainItems[0], mainItems[0]]; // Fallback for when there's only 1 item
    };

    return {
      main: mainItems[0] || {} as NewsItem,
      side: getSideItems(),
      variant: 'a' as const
    };
  }, [data?.pages]);

  if (isLoading) {
    return (
      <div className={cn('space-y-8', className)}>
        {[0, 1].map((i) => (
          <div key={i} className="animate-pulse space-y-4">
            <div className="h-6 bg-muted w-1/3 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-4 bg-muted w-3/4 rounded"></div>
                <div className="h-4 bg-muted w-1/2 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-4 bg-muted w-5/6 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data?.pages?.[0]?.data?.items?.length) {
    return (
      <div className={cn('p-4 bg-destructive/10 text-destructive rounded-md', className)}>
        {error?.message || 'Failed to load news'}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <NewsLayout
        mainNews={layoutGroup.main}
        sideNews={layoutGroup.side}
        variant={currentVariant}
        showCategory={true}
        showDate={true}
        showReadTime={true}
        showDescription={true}
      />
      
      {data?.pages?.[0]?.data?.items && data.pages[0].data.items.length > 3 && (
        <div className="flex justify-center mt-4">
          <a
            href={`/${formattedCategory}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all {formattedCategory} news →
          </a>
        </div>
      )}
    </div>
  );
});

FrontPageSection.displayName = 'FrontPageSection';

interface FrontPageSectionsProps {
  categories: string[];
  layout?: LayoutVariant | LayoutVariant[];
  offset?: number | number[];
  limit?: number;
  className?: string;
}

const FrontPageSections: React.FC<FrontPageSectionsProps> = ({
  categories,
  layout = 'a',
  offset = 0,
  limit = 3, // Set default limit to 3
}) => {
  const getLayoutForIndex = (index: number): LayoutVariant => {
    if (!layout) return 'a';
    if (Array.isArray(layout)) {
      return layout[index % layout.length] || 'a';
    }
    return layout;
  };

  const getOffsetForIndex = (index: number): number => {
    if (Array.isArray(offset)) {
      // Make sure we don't go out of bounds
      if (index >= offset.length) {
        return offset[offset.length - 1] || 0;
      }
      return offset[index] || 0;
    }
    return offset || 0;
  };

  return (
    <div className="space-y-12">
      {categories.map((cat, index) => (
        <FrontPageSection
          key={cat}
          category={cat}
          limit={limit}
          offset={getOffsetForIndex(index)}
          layoutVariant={getLayoutForIndex(index)}
        />
      ))}
    </div>
  );
};

export default FrontPageSections;