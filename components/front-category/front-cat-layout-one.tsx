// components/front-category/front-cat-layout-one.tsx
import React from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';

// Define the prop types for the card components
type CardComponent = React.ComponentType<{ 
  item: NewsItem; 
  showCategory: boolean; 
  className?: string 
}>;

interface FrontCategoryLayoutOneProps {
  mainCategory?: string;
  secondCategory?: string;
  thirdCategory?: string;
  fourthCategory?: string;
  fifthCategory?: string; 
  className?: string;
  MainCard: CardComponent;  // Left top card
  SecondCard: CardComponent; // Center card
  ThirdCard: CardComponent;  // Left bottom card
  FourthCard: CardComponent; // Right top card
  FifthCard: CardComponent;  // Right bottom card
}

const FrontCategoryLayoutOne: React.FC<FrontCategoryLayoutOneProps> = ({
  mainCategory = 'sports',
  secondCategory = 'world',
  thirdCategory = 'business',
  fourthCategory = 'technology',
  fifthCategory = 'turkiye',
  className = '',
  MainCard,   
  SecondCard, 
  ThirdCard,
  FourthCard,
  FifthCard,
}) => {
  // Format category name to match API expectations (e.g., 'business' -> 'Business')
  const formatCategoryName = (cat: string) => {
    if (!cat || cat === 'all') return undefined;
    // Capitalize first letter and make the rest lowercase
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  // Fetch news for each card's specific category
  const { data: mainData, isLoading: mainLoading, error: mainError } = useNews({
    category: formatCategoryName(mainCategory),
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  const { data: secondData, isLoading: secondLoading, error: secondError } = useNews({
    category: formatCategoryName(secondCategory),
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  const { data: thirdData, isLoading: thirdLoading, error: thirdError } = useNews({
    category: formatCategoryName(thirdCategory),
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  const { data: fourthData, isLoading: fourthLoading, error: fourthError } = useNews({
    category: formatCategoryName(fourthCategory),
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  const { data: fifthData, isLoading: fifthLoading, error: fifthError } = useNews({
    category: formatCategoryName(fifthCategory),
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  // Access the news items with proper type safety
  const mainNewsItems = Array.isArray(mainData?.pages?.[0]?.data?.items) ? mainData.pages[0].data.items : [];
  const secondNewsItems = Array.isArray(secondData?.pages?.[0]?.data?.items) ? secondData.pages[0].data.items : [];
  const thirdNewsItems = Array.isArray(thirdData?.pages?.[0]?.data?.items) ? thirdData.pages[0].data.items : [];
  const fourthNewsItems = Array.isArray(fourthData?.pages?.[0]?.data?.items) ? fourthData.pages[0].data.items : [];
  const fifthNewsItems = Array.isArray(fifthData?.pages?.[0]?.data?.items) ? fifthData.pages[0].data.items : [];

  if (mainLoading || secondLoading || thirdLoading || fourthLoading || fifthLoading) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    );
  }

  if (mainError || secondError || thirdError || fourthError || fifthError) {
    console.error('Error loading news:', mainError || secondError || thirdError || fourthError || fifthError);
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">
          Error loading news. Please try again later.
        </p>
      </div>
    );
  }

  if (
    (!mainLoading && mainNewsItems.length < 1) ||
    (!secondLoading && secondNewsItems.length < 1) ||
    (!thirdLoading && thirdNewsItems.length < 1) ||
    (!fourthLoading && fourthNewsItems.length < 1) ||
    (!fifthLoading && fifthNewsItems.length < 1)
  ) {
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">Not enough news available for one or more categories.</p>
      </div>
    );
  }

  // Safely get individual items for each card
  const mainItem = mainNewsItems[0];
  const secondItem = secondNewsItems[0];
  const thirdItem = thirdNewsItems[0];
  const fourthItem = fourthNewsItems[0];
  const fifthItem = fifthNewsItems[0];

  return (
    <div className={cn('grid grid-cols-12 gap-4 w-full', className)}>
      {/* Left Column - 3/12 width */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
        {mainItem && (
          <div className="flex-1">
            <MainCard
              item={mainItem}
              showCategory={true}
              className="h-full"
            />
          </div>
        )}
        {thirdItem && (
          <div className="flex-1">
            <ThirdCard
              item={thirdItem}
              showCategory={true}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Center Column - 6/12 width */}
      <div className="col-span-12 md:col-span-6">
        {secondItem && (
          <SecondCard
            item={secondItem}
            showCategory={true}
            className="h-full"
          />
        )}
      </div>

      {/* Right Column - 3/12 width */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
        {fourthItem && (
          <div className="flex-1">
            <FourthCard
              item={fourthItem}
              showCategory={true}
              className="h-full"
            />
          </div>
        )}
        {fifthItem && (
          <div className="flex-1">
            <FifthCard
              item={fifthItem}
              showCategory={true}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontCategoryLayoutOne;