// components/frontPageSections.tsx
'use client';

import { memo, useMemo, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';

// Lazy load components
const NewsLayout = lazy(() => import('./cards/NewsLayout'));
const BannerCTA = dynamic(() => import('./expostep'), { ssr: false });

type LayoutVariant = 'a' | 'b';

interface FrontPageSectionProps {
  category: string;
  limit?: number;
  offset?: number;
  layoutVariant?: LayoutVariant;
  className?: string;
}

// Simple loading component
const NewsLoading = () => (
  <div className="space-y-4">
    <div className="h-6 bg-muted/20 w-1/3 rounded"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-64 bg-muted/20 rounded"></div>
        <div className="h-4 bg-muted/20 w-3/4 rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-muted/20 rounded"></div>
        <div className="h-4 bg-muted/20 w-5/6 rounded"></div>
      </div>
    </div>
  </div>
);

const FrontPageSection = memo<FrontPageSectionProps>(({
  category,
  limit = 3,
  offset = 0,
  layoutVariant = 'a',
  className,
}) => {
  const formatCategoryName = (cat: string) => {
    return cat.toLowerCase() === 'türkiye' ? 'turkiye' : cat.toLowerCase();
  };

  const formattedCategory = formatCategoryName(category);
  const { data, isLoading, error } = useNews({
    category: formattedCategory,
    limit,
    offset,
    sort: 'newest',
  });
  
  const layoutGroup = useMemo(() => {
    // Create a default NewsItem to use as fallback
    const defaultNewsItem: NewsItem = {
      id: '',
      source_id: '',
      source_guid: '',
      title: 'No news available',
      slug: '',
      excerpt: 'Check back later for updates',
      content: '',
      seo_title: 'No news available',
      seo_description: 'No news items are currently available',
      status: 'published',
      featured: false,
      view_count: 0,
      read_time: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: '',
      image_alt: '',
      image_caption: '',
      author_id: null,
      source_url: null,
      categories: [],
      tags: [],
      meta: {},
      image: '',
      category: 'turkiye',
      tldr: [],
      original_url: '',
      file_path: '',
      is_bookmarked: false
    };

    if (!data?.pages?.[0]?.data?.items?.length) {
      return { 
        main: defaultNewsItem, 
        side: [defaultNewsItem, defaultNewsItem] as [NewsItem, NewsItem] 
      };
    }

    const items = data.pages[0].data.items as NewsItem[];
    const mainItem = items[0] || defaultNewsItem;
    const sideItems = items.slice(1, 3);
    
    return {
      main: mainItem,
      side: [
        sideItems[0] || defaultNewsItem,
        sideItems[1] || defaultNewsItem
      ] as [NewsItem, NewsItem],
    };
  }, [data?.pages]);

  if (isLoading) {
    return <NewsLoading />;
  }

  if (error || !data?.pages?.[0]?.data?.items?.length) {
    return (
      <div className={cn('p-4 bg-destructive/10 text-destructive rounded-md', className)}>
        {error?.message || 'No news available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<NewsLoading />}>
        <div className={cn('space-y-4', className)}>
          {layoutGroup.main && (
            <NewsLayout
              mainNews={layoutGroup.main}
              sideNews={layoutGroup.side}
              variant={layoutVariant}
            />
          )}
        </div>
      </Suspense>
      {formattedCategory === 'turkiye' && (
        <div className="mt-8">
          <BannerCTA />
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

const FrontPageSections = ({
  categories,
  layout = 'a',
  offset = 0,
  limit = 3,
  className,
}: FrontPageSectionsProps) => {
  const getLayoutVariant = (index: number): LayoutVariant => {
    if (Array.isArray(layout)) {
      return layout[index % layout.length] || 'a';
    }
    return layout;
  };

  const getOffset = (index: number): number => {
    if (Array.isArray(offset)) {
      return offset[index] || 0;
    }
    return offset || 0;
  };

  return (
    <div className="space-y-12">
      {categories.map((category, index) => (
        <FrontPageSection
          key={`${category}-${index}`}
          category={category}
          limit={limit}
          offset={getOffset(index)}
          layoutVariant={getLayoutVariant(index)}
          className={className}
        />
      ))}
    </div>
  );
};

export default memo(FrontPageSections);