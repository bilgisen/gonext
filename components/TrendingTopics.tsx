// components/TrendingTopics.tsx
'use client';

import { useTrendingTags } from '@/hooks/useTagNews';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Tag } from '@/types/tag';

const getFontSize = (count: number, maxCount: number) => {
  const minSize = 12; // min font size in px
  const maxSize = 24; // max font size in px
  const range = maxSize - minSize;
  
  // Calculate font size based on count (logarithmic scale)
  const size = minSize + (Math.log2(count + 1) / Math.log2(maxCount + 1)) * range;
  return Math.round(size);
};

const getRandomRotation = () => {
  return Math.floor(Math.random() * 30) - 15; // Random angle between -15 and 15 degrees
};

export function TrendingTopics() {
  const { data: trendingTags, isLoading, error } = useTrendingTags(20, 1);

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading trending topics...</div>;
  }

  if (error || !trendingTags?.length) {
    return null; // Don't show anything if there's an error or no tags
  }

  // Filter out 'turkiye' tag (case-insensitive) and any undefined/null tags
  const filteredTags = trendingTags
    .filter((tag: Tag) => tag?.name && tag.name.toLowerCase() !== 'turkiye')
    .map((tag: Tag) => ({
      ...tag,
      // Remove any leading # from tag names
      name: tag.name.startsWith('#') ? tag.name.slice(1) : tag.name
    }));
  
  if (filteredTags.length === 0) {
    return null; // Don't show if no tags after filtering
  }

  const maxCount = Math.max(...filteredTags.map((tag: Tag) => tag.count), 1);

  return (
    <div className="rounded-lg bg-background p-0 shadow-sm ">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Trending Topics</h2>
      <div className="flex flex-wrap gap-2">
        {filteredTags.map((tag: Tag) => {
          const fontSize = getFontSize(tag.count, maxCount);
          const rotation = getRandomRotation();
          
          return (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                'hover:scale-105 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
                'bg-card text-foreground hover:bg-accent/10 dark:hover:bg-accent/20',
                'border border-border/20 dark:border-border/30'
              )}
              style={{
                fontSize: `${fontSize}px`,
                transform: `rotate(${rotation}deg)`,
                '--tw-ring-color': 'hsl(var(--primary) / 0.1)',
              } as React.CSSProperties}
            >
              {tag.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}