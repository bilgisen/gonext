import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';

const DefaultCard = dynamic(() => import('@/components/cards/front-cat-feat-newscard'), { ssr: false });

type CardComponent = React.ComponentType<{
  item: NewsItem;
  showCategory?: boolean;
  showDescription?: boolean;
  compactTitle?: boolean;
  className?: string;
}>;

interface FrontCategoryLayoutOneProps {
  mainCategory?: string;
  secondCategory?: string;
  thirdCategory?: string;
  fourthCategory?: string;
  fifthCategory?: string;
  className?: string;
  MainCard?: CardComponent;
  SecondCard?: CardComponent;
  ThirdCard?: CardComponent;
  FourthCard?: CardComponent;
  FifthCard?: CardComponent;
}

const FrontCategoryLayoutOne: React.FC<FrontCategoryLayoutOneProps> = memo(({
  mainCategory = 'sports',
  secondCategory = 'world',
  thirdCategory = 'business',
  fourthCategory = 'technology',
  fifthCategory = 'turkiye',
  className = '',
  MainCard = DefaultCard,
  SecondCard = DefaultCard,
  ThirdCard = DefaultCard,
  FourthCard = DefaultCard,
  FifthCard = DefaultCard,
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
    <div className={cn('grid grid-cols-12 gap-5 w-full', className)}>
      {/* Sol kolon */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
        <MainCard item={mainItem!} showCategory compactTitle showDescription={false} className="h-full" />
        <ThirdCard item={thirdItem!} showCategory compactTitle showDescription={false} className="h-full" />
      </div>

      {/* Orta kolon */}
      <div className="col-span-12 md:col-span-6">
        <SecondCard item={secondItem!} showCategory showDescription compactTitle={false} className="h-full" />
      </div>

      {/* Sağ kolon */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
        <FourthCard item={fourthItem!} showCategory compactTitle showDescription={false} className="h-full" />
        <FifthCard item={fifthItem!} showCategory compactTitle showDescription={false} className="h-full" />
      </div>
    </div>
  );
});

FrontCategoryLayoutOne.displayName = 'FrontCategoryLayoutOne';

export default FrontCategoryLayoutOne;
