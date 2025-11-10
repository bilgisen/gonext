'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/types/news';
import { createSlug } from '@/lib/utils/string-utils';

interface LatestNewsProps {
  items: NewsItem[];
  className?: string;
  limit?: number;
}

export default function LatestNews({ items, className, limit = 10 }: LatestNewsProps) {
  if (!items?.length) return null;

  const getCategorySlug = (category: any): string => {
    if (!category) return 'turkiye';
    
    if (typeof category === 'object' && 'slug' in category) {
      return category.slug || 'turkiye';
    }
    
    if (typeof category === 'string') {
      // Use createSlug for string categories
      return createSlug(category);
    }
    
    return 'turkiye';
  };

  const getCategoryDisplayName = (category: any): string => {
    if (!category) return 'News';
    
    if (typeof category === 'object' && 'name' in category) {
      return category.name;
    }
    
    if (typeof category === 'string') {
      // Convert to title case for display
      return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    }
    
    return 'News';
  };

  return (
    <div className={className}>
      <h3 className="text-xl font-semibold mb-3 pb-2 border-b border-border/50">Latest News</h3>
      <ul className="space-y-1">
        {items.slice(0, limit).map((item) => {
          const categorySlug = getCategorySlug(item.category);
          const timeAgo = item.publishedAt 
            ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
            : 'just now';
          
          return (
            <li key={item.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                  <Link 
                    href={`/${categorySlug}`}
                    className="hover:text-primary hover:underline transition-colors"
                  >
                    {getCategoryDisplayName(item.category)}
                  </Link>
                  <span className="text-muted-foreground/80 text-xs">{timeAgo}</span>
                </div>
                <Link 
                  href={`/${categorySlug}/${item.slug}`}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                >
                  {item.title}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
