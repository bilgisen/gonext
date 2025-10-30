import React from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import FrontCategoryMainNewsCard from './front-cat-main-newscard';
import FrontCategorySecondNewsCard from './front-cat-second-newscard';
import FrontCategoryThirdNewsCard from './front-cat-third-newscard';
import type { NewsItem } from '@/types/news';

interface FrontCardLayoutTwoProps {
  category?: string;
  limit?: number;
  className?: string;
}

const FrontCardLayoutTwo: React.FC<FrontCardLayoutTwoProps> = ({
  category = 'all',
  limit = 5, // Show exactly 5 items (1 center + 2 left + 2 right)
  className = '',
}) => {
  // Debug log the props
  console.log('FrontCardLayoutTwo - props:', { category, limit });

  // Format category name to match API expectations (e.g., 'business' -> 'Business')
  const formatCategoryName = (cat: string) => {
    if (!cat || cat === 'all') return undefined;
    // Capitalize first letter and make the rest lowercase
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  // Fetch news using the useNews hook with properly formatted category
  const formattedCategory = formatCategoryName(category);
  const { data, isLoading, error } = useNews({
    category: formattedCategory,
    limit,
    sort: 'newest',
    enabled: true,
  });
  
  // Debug logs for better troubleshooting
  console.log('FrontCardLayoutTwo - Raw API response:', data);
  console.log('FrontCardLayoutTwo - Pages:', data?.pages);
  console.log('FrontCardLayoutTwo - First page:', data?.pages?.[0]);
  
  // Access the news items from the response according to NewsListResponse type
  const newsItems: NewsItem[] = data?.pages?.[0]?.data?.items || [];
  
  console.log('Filtered news items for category', { 
    originalCategory: category, 
    formattedCategory,
    items: newsItems,
    hasItems: newsItems.length > 0
  });

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

  // Take only the first 5 news items (1 for left, 2 for center, 2 for right)
  const items = newsItems.slice(0, 5);
  const [firstItem, secondItem, thirdItem, fourthItem, fifthItem] = items;

  return (
    <div className={cn('grid grid-cols-12 gap-6 w-full', className)}>
      {/* Left Column - 6/12 width */}
      <div className="col-span-12 md:col-span-6">
        {firstItem && (
          <FrontCategorySecondNewsCard
            item={firstItem}
            showCategory={category === 'all'}
            className="h-full"
          />
        )}
      </div>

      {/* Center Column - 3/12 width */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
        {secondItem && (
          <div className="flex-1">
            <FrontCategoryMainNewsCard
              item={secondItem}
              showCategory={category === 'all'}
              className="h-full"
            />
          </div>
        )}
        {thirdItem && (
          <div className="flex-1">
            <FrontCategoryThirdNewsCard
              item={thirdItem}
              showCategory={category === 'all'}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Right Column - 3/12 width */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
        {fourthItem && (
          <div className="flex-1">
            <FrontCategoryThirdNewsCard
              item={fourthItem}
              showCategory={category === 'all'}
              className="h-full"
            />
          </div>
        )}
        {fifthItem && (
          <div className="flex-1">
            <FrontCategoryMainNewsCard
              item={fifthItem}
              showCategory={category === 'all'}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontCardLayoutTwo;
