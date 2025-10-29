'use client';

import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
import Link from 'next/link';

interface NewsCardProps {
  item: any;
  index: number;
  isLarge?: boolean;
  isSmall?: boolean;
  isSmallTitle?: boolean;
  className?: string;
  category?: string; // Optional category override
}

// Moved outside the component
const NewsCard = ({ 
  item, 
  isLarge = false, 
  isSmall = false, 
  isSmallTitle = false, 
  index, 
  className, 
  category 
}: NewsCardProps) => {
  const imageKey = item.image ? item.image.split('/').pop() : null;
  
  // Use the provided category or fall back to the one from the item
  const displayCategory = category || item.category;
  
  // Moved getCategoryColor inside NewsCard since it's only used here
  const getCategoryColor = (category: string) => {
    const colors = {
      business: 'bg-blue-500',
      world: 'bg-green-500',
      technology: 'bg-purple-500',
      sports: 'bg-red-500',
      entertainment: 'bg-pink-500',
      default: 'bg-gray-500',
    };
    return colors[category?.toLowerCase() as keyof typeof colors] || colors.default;
  };

  return (
    <Link 
      href={`/${item.category}/${item.slug || item.id}`}
      className={cn(
        'group relative overflow-hidden rounded-xl cursor-pointer h-full',
        'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
        'hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_4px_8px_rgba(0,0,0,.1),0_16px_32px_rgba(0,0,0,.1)]',
        'hover:dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset,0_0_0_1px_rgba(255,255,255,.1),0_4px_8px_rgba(0,0,0,.2)]',
        'transition-all duration-300',
        isLarge ? 'md:col-span-2' : 'md:col-span-1',
        index === 0 ? 'row-span-2' : ''
      )}
    >
      <div className={cn("relative w-full h-full", className)}>
        {imageKey ? (
          <BlobImage
            imageKey={imageKey}
            alt={item.seo_title || 'News image'}
            width={isLarge ? 800 : 400}
            height={isLarge ? 600 : 300}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={isLarge ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-primary/20 to-primary/5" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

        {displayCategory && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2 py-1 ${getCategoryColor(displayCategory)} text-white rounded text-xs font-medium`}>
              {displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1)}
            </span>
          </div>
        )}

        {item.read_time && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-1 bg-black/60 text-white rounded text-xs font-medium backdrop-blur-sm">
              {item.read_time} min
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-0 right-0 p-6 z-10">
          <h3 className={cn(
            'font-semibold text-white leading-tight line-clamp-2',
            isLarge ? 'text-2xl md:text-3xl' : 
            isSmall ? 'text-lg md:text-xl' : 
            isSmallTitle ? 'text-base md:text-lg' : 'text-xl md:text-2xl'
          )}>
            {item.seo_title || item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

interface BentoFrontProps {
  news: any[];
  className?: string;
  // Optional categories for each card position
  categories?: {
    // First row
    firstLarge?: string;
    firstSmall1?: string;
    firstSmall2?: string;
    // Second row
    second1?: string;
    second2?: string;
    // Third row
    third1?: string;
    third2?: string;
    third3?: string;
  };
}

export function BentoFront({ news, className, categories = {} }: BentoFrontProps) {
  // Helper function to get news items by category with flexible matching
  const getNewsByCategory = (category: string, excludeIds: string[] = []) => {
    if (!category) return null;
    
    // First try exact match
    let foundItem = news.find(item => 
      item.category?.toLowerCase() === category.toLowerCase() && 
      !excludeIds.includes(item.id)
    );
    
    // If no exact match, try partial match
    if (!foundItem) {
      foundItem = news.find(item => 
        item.category?.toLowerCase().includes(category.toLowerCase()) && 
        !excludeIds.includes(item.id)
      );
    }
    
    // If still no match, get any available news item
    if (!foundItem) {
      foundItem = news.find(item => !excludeIds.includes(item.id));
    }
    
    return foundItem || null;
  };

  // Track used news IDs to avoid duplicates
  const usedIds = new Set<string>();
  
  // Get news for each position based on category
  const firstLarge = getNewsByCategory(categories.firstLarge || 'business');
  if (firstLarge) usedIds.add(firstLarge.id);
  
  const firstSmall1 = getNewsByCategory(categories.firstSmall1 || 'world', [...usedIds]);
  if (firstSmall1) usedIds.add(firstSmall1.id);
  
  const firstSmall2 = getNewsByCategory(categories.firstSmall2 || 'world', [...usedIds]);
  if (firstSmall2) usedIds.add(firstSmall2.id);
  
  const second1 = getNewsByCategory(categories.second1 || 'business', [...usedIds]);
  if (second1) usedIds.add(second1.id);
  
  const second2 = getNewsByCategory(categories.second2 || 'world', [...usedIds]);
  if (second2) usedIds.add(second2.id);
  
  const third1 = getNewsByCategory(categories.third1 || 'technology', [...usedIds]);
  if (third1) usedIds.add(third1.id);
  
  const third2 = getNewsByCategory(categories.third2 || 'sports', [...usedIds]);
  if (third2) usedIds.add(third2.id);
  
  const third3 = getNewsByCategory(categories.third3 || 'entertainment', [...usedIds]);
  if (third3) usedIds.add(third3.id);
  
  // Group into rows
  const firstRow = [firstLarge, firstSmall1, firstSmall2].filter(Boolean);
  const secondRow = [second1, second2].filter(Boolean);
  const thirdRow = [third1, third2, third3].filter(Boolean);
  
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* First Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {firstRow[0] && (
          <NewsCard 
            item={firstRow[0]} 
            index={0} 
            isLarge={true} 
            category={categories.firstLarge} 
          />
        )}
        <div className="flex flex-col space-y-4 md:space-y-6">
          {firstRow[1] && (
            <NewsCard 
              item={firstRow[1]} 
              index={1} 
              isSmall={true} 
              category={categories.firstSmall1} 
            />
          )}
          {firstRow[2] && (
            <NewsCard 
              item={firstRow[2]} 
              index={2} 
              isSmall={true} 
              category={categories.firstSmall2} 
            />
          )}
        </div>
      </div>

      {/* Second Row */}
      {secondRow.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {secondRow.map((item, index) => (
            <NewsCard 
              key={`second-${item.id || index}`} 
              item={item} 
              index={index + 3} 
              category={index === 0 ? categories.second1 : categories.second2}
            />
          ))}
        </div>
      )}

      {/* Third Row */}
      {thirdRow.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {thirdRow.map((item, index) => (
            <NewsCard 
              key={`third-${item.id || index}`} 
              item={item} 
              index={index + 5} 
              isSmall={true} 
              category={
                index === 0 ? categories.third1 : 
                index === 1 ? categories.third2 : 
                categories.third3
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}