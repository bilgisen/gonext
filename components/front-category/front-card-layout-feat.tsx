import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNews } from '@/hooks/useNews';
import { cn } from '@/lib/utils';
import FrontCategoryFourthNewsCard from './front-cat-fourth-newscard ';
import type { NewsItem } from '@/types/news';

// Move the CategoryNewsItem component outside the main component
// and make it a proper React component
const CategoryNewsItem: React.FC<{ 
  category: string; 
  onData: (data: any) => void 
}> = ({ category, onData }) => {
  console.log(`Rendering CategoryNewsItem for category: ${category}`);
  
  const { data, isLoading, error } = useNews({
    category,
    limit: 1,
    sort: 'newest',
    enabled: true,
  });

  console.log(`Category ${category} data:`, { data, isLoading, error });

  // Notify parent when data is loaded
  useEffect(() => {
    console.log(`Category ${category} update:`, { data, isLoading, error });
    onData({ category, data, isLoading, error });
  }, [data, isLoading, error, category, onData]);

  return null; // This component doesn't render anything
};

// Custom hook to fetch news for multiple categories
const useMultipleCategoryNews = (categories: string[]) => {
  const [queriesData, setQueriesData] = useState<Array<{
    category: string;
    data: any;
    isLoading: boolean;
    error: Error | null;
  }>>(() => categories.map(category => ({
    category,
    data: null,
    isLoading: true,
    error: null
  })));

  // Handle data from each category component
  const handleCategoryData = useCallback((newData: any) => {
    console.log('Received data for category:', newData.category, newData);
    
    setQueriesData(prev => {
      // Skip if we already have data for this category
      const existingItem = prev.find(item => item.category === newData.category);
      if (existingItem?.data && !newData.data) {
        console.log('Skipping update for', newData.category, 'as it already has data');
        return prev;
      }
      
      // Update or add the category data
      const existingIndex = prev.findIndex(item => item.category === newData.category);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newData,
          // Only update data if we have new data
          data: newData.data || updated[existingIndex].data
        };
        console.log('Updated category data:', updated[existingIndex]);
        return updated;
      }
      
      const newState = [...prev, newData];
      console.log('Added new category data:', newData);
      return newState;
    });
  }, []);

  // Create a component for each category
  const categoryComponents = useMemo(() => {
    return categories.map(category => (
      <CategoryNewsItem 
        key={category} 
        category={category} 
        onData={handleCategoryData} 
      />
    ));
  }, [categories, handleCategoryData]);

  const isLoading = queriesData.length < categories.length || 
                   queriesData.some(q => q.isLoading === true);
  const error = queriesData.find(q => q.error)?.error;

  console.log('useMultipleCategoryNews state:', {
    categories,
    queriesData,
    isLoading,
    error,
    hasData: queriesData.every(q => q.data)
  });

  return {
    categoryComponents: <div style={{ display: 'none' }}>{categoryComponents}</div>,
    queries: queriesData,
    isLoading,
    error,
  };
};

interface FrontCardLayoutFeatProps {
  category?: string;
  limit?: number;
  className?: string;
}

const FrontCardLayoutFeat: React.FC<FrontCardLayoutFeatProps> = ({
  category = 'all',
  limit = 5,
  className = '',
}) => {
  // Format category name to match API expectations
  const formatCategoryName = useCallback((cat: string) => {
    if (!cat || cat === 'all') return undefined;
    // Map category names to match your API's expected format
    const categoryMap: Record<string, string> = {
      'sports': 'Sports',
      'turkiye': 'Turkiye',
      'world': 'World',
      'business': 'Business',
      'culture': 'Culture'
    };
    return categoryMap[cat.toLowerCase()] || cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  }, []);

  const formattedCategory = useMemo(() => formatCategoryName(category), [category, formatCategoryName]);
  const centerColumnCategories = useMemo(() => ['sports', 'turkiye', 'world', 'business'], []);
  
  // Fetch main category news first
  const { 
    data: mainCategoryData, 
    isLoading: isMainLoading, 
    error: mainError 
  } = useNews({
    category: formattedCategory,
    limit,
    sort: 'newest',
    // enabled is handled by the hook
  });
  
  // Log the main category query status after the hook is called
  useEffect(() => {
    console.log('Main category query status:', {
      category,
      formattedCategory,
      hasData: !!mainCategoryData,
      isLoading: isMainLoading,
      error: mainError
    });
  }, [category, formattedCategory, mainCategoryData, isMainLoading, mainError]);
  
  // Fetch news for center column categories
  const { 
    categoryComponents,
    queries: categoryQueries, 
    isLoading: areCategoriesLoading, 
    error: categoryError 
  } = useMultipleCategoryNews(centerColumnCategories);
  
  const isLoading = isMainLoading || areCategoriesLoading;
  const error = mainError || categoryError;
  
  // Get main category news items
  const newsItems: NewsItem[] = useMemo(() => {
    // Access the first page of results
    const firstPage = mainCategoryData?.pages?.[0];
    // Try different response structures
    const items = (firstPage as any)?.data?.items || 
                 (firstPage as any)?.items || 
                 [];
    console.log('Main category items:', { 
      items, 
      mainCategoryData,
      firstPage
    });
    return items;
  }, [mainCategoryData]);
  
  // Prepare center column items with proper data access
  const centerColumnItems = useMemo(() => {
    return centerColumnCategories.map(cat => {
      const queryData = categoryQueries.find(q => q.category === cat);
      
      // Safely access the items from the API response
      const pageData = queryData?.data?.pages?.[0];
      const items = pageData?.data?.items || 
                   pageData?.items || 
                   [];
      
      const isLoading = queryData?.isLoading ?? true;
      const error = queryData?.error;
      
      console.log(`Category ${cat} data:`, {
        hasData: !!queryData?.data,
        pages: queryData?.data?.pages,
        firstPage: pageData,
        items,
        isLoading,
        error,
        queryData
      });
      
      return {
        category: cat,
        items: items,
        isLoading,
        error
      };
    });
  }, [categoryQueries, centerColumnCategories]);
  
  if (isLoading) {
    return (
      <div className={`grid grid-cols-12 gap-6 w-full ${className}`}>
        {/* Loading skeletons */}
        <div className="col-span-12 md:col-span-6">
          <div className="h-96 animate-pulse rounded-lg bg-muted/30" />
        </div>
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
        </div>
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">
          Error loading news. Please try again later.
        </p>
      </div>
    );
  }

  const hasMainNews = newsItems.length > 0;
  const hasCenterNews = centerColumnItems.some(item => item.items.length > 0);
  
  if (!hasMainNews && !hasCenterNews) {
    return (
      <div className={`rounded-lg border border-dashed p-8 text-center ${className}`}>
        <p className="text-muted-foreground">
          {category === 'all' 
            ? 'No news available at the moment.' 
            : `No news available for ${category}.`}
        </p>
      </div>
    );
  }

  // Take 3 news items from the main category
  const [firstItem, thirdItem, fourthItem] = newsItems.slice(0, 3);

  return (
    <>
      {categoryComponents}
      <div className={cn('grid grid-cols-12 gap-6 w-full', className)}>
        {/* Left Column - 6/12 width */}
        <div className="col-span-12 md:col-span-6">
          {firstItem && (
            <FrontCategoryFourthNewsCard
              item={firstItem}
              category={category === 'all' ? undefined : category}
              showCategory={category === 'all'}
              className="h-full"
            />
          )}
        </div>

        {/* Center Column - 3/12 width */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
          {centerColumnItems.map(({ category: cat, items, isLoading, error }) => {
            // Skip rendering if no data is available yet
            if (isLoading) {
              return (
                <div key={cat} className="h-64 animate-pulse rounded-lg bg-muted/30" />
              );
            }
            
            if (error) {
              return (
                <div key={cat} className="h-64 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <p className="text-destructive">Error loading {cat} news</p>
                </div>
              );
            }
            
            const displayCategory = cat === 'turkiye' ? 'Türkiye' : 
                                 cat === 'sports' ? 'Sports' : 
                                 cat.charAt(0).toUpperCase() + cat.slice(1);
            
            // Log the item being rendered for debugging
            if (items[0]) {
              console.log(`Rendering ${displayCategory} item:`, items[0]);
            } else {
              console.log(`No items found for ${displayCategory}`);
            }
            
            return (
              <div key={cat} className="flex-1">
                {items[0] ? (
                  <FrontCategoryFourthNewsCard
                    item={items[0]}
                    category={displayCategory}
                    showCategory={true}
                    className="h-full"
                  />
                ) : (
                  <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No {displayCategory} news available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column - 3/12 width */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4 h-full">
          {thirdItem && (
            <div className="flex-1">
              <FrontCategoryFourthNewsCard
                item={thirdItem}
                category={category === 'all' ? undefined : category}
                showCategory={category === 'all'}
                className="h-full"
              />
            </div>
          )}
          {fourthItem && (
            <div className="flex-1">
              <FrontCategoryFourthNewsCard
                item={fourthItem}
                category={category === 'all' ? undefined : category}
                showCategory={category === 'all'}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FrontCardLayoutFeat;