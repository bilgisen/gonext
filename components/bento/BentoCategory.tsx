// components/bento/BentoCategory.tsx
import { memo } from 'react';
import BentoLayout from './BentoLayout';
import FallbackNewsGrid from './FallbackNewsGrid';
import type { NewsItem } from '@/types/news';

export interface BentoCategoryProps {
  category?: string;
  news?: NewsItem[];
  className?: string;
  layout?: 'a' | 'b' | 'c';
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  maxItems?: number;
}

const BentoCategoryComponent = ({
  category = 'all',
  news = [],
  className = '',
  layout = 'a',
  showCategory = false,
  showDate = false,
  showReadTime = false,
  maxItems = 8,
}: BentoCategoryProps) => {
  // Log the input data for debugging
  console.log('BentoCategory - Input news:', news);
  console.log('BentoCategory - Category:', category);
  console.log('BentoCategory - maxItems:', maxItems);

  // Filter and limit news items
  const filteredNews = (news || [])
    .filter(item => {
      if (!item?.id) {
        console.log('Filtering out item with no ID:', item);
        return false;
      }
      if (category === 'all') {
        console.log('Including item (all categories):', item.id, item.seo_title);
        return true;
      }

      const targetCategory = category.toLowerCase();
      
      // Check direct category match
      if (item.category && String(item.category).toLowerCase() === targetCategory) {
        console.log(`Including item by direct category match (${item.category}):`, item.id, item.seo_title);
        return true;
      }

      // Check if category is in the slug
      if (item.slug?.toLowerCase().includes(targetCategory)) {
        console.log(`Including item by slug match (${item.slug}):`, item.id, item.seo_title);
        return true;
      }

      // Check if category is in tags
      const hasMatchingTag = item.tags?.some(tag => 
        tag && typeof tag === 'string' && tag.toLowerCase().includes(targetCategory)
      );
      
      if (hasMatchingTag) {
        console.log(`Including item by tag match (${item.tags?.join(', ')}):`, item.id, item.seo_title);
        return true;
      }

      console.log('Excluding item - no category/slug/tag match:', item.id, item.seo_title, {
        itemCategory: item.category,
        itemSlug: item.slug,
        itemTags: item.tags,
        targetCategory
      });
      return false;
    })
    .slice(0, maxItems);
    
  console.log('BentoCategory - Filtered news:', filteredNews);

  // If no news items are available or not enough for BentoLayout, show fallback
  if (filteredNews.length < 7) {
    const emptyCount = Math.min(4, maxItems);
    const emptyItems: NewsItem[] = Array(emptyCount).fill(null).map((_, index) => ({
      id: `fallback-${index}`,
      source_guid: 'fallback',
      source_id: 'fallback',
      seo_title: 'No news available',
      seo_description: 'Check back later for updates',
      tldr: ['No content available'],
      content_md: 'No content available',
      category: category,
      categories: [category],
      tags: [],
      image: '',
      image_title: '',
      image_desc: '',
      original_url: '',
      file_path: '',
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slug: `fallback-${index}`,
      read_time: 0,
    }));
    
    return (
      <div className={className}>
        <h2 className="text-2xl font-bold capitalize mb-4">{category} News</h2>
        <FallbackNewsGrid 
          items={emptyItems}
          showCategory={showCategory}
          showDate={showDate}
          showReadTime={showReadTime}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold capitalize mb-4">{category} News</h2>
      <BentoLayout 
        items={filteredNews}
        layout={layout}
        showCategory={showCategory}
        showDate={showDate}
        showReadTime={showReadTime}
      />
    </div>
  );
};

// Memoize the component
const BentoCategory = memo(BentoCategoryComponent);

// Set the display name for debugging and tooling
BentoCategory.displayName = 'BentoCategory';

export default BentoCategory;