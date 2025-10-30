import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { formatNewsDate } from '@/lib/utils/date-utils';
import { Calendar } from 'lucide-react';
import BlobImage from '@/components/BlobImage';

// Extend the NewsItem type to include required properties
type ExtendedNewsItem = NewsItem & {
  title: string;
  category?: string;
  published_at: string;
  slug: string;
  image?: string;
};

interface FeatSecondNewsCardProps {
  items: ExtendedNewsItem[];
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
}

const FeatSecondNewsCard: React.FC<FeatSecondNewsCardProps> = ({
  items = [],
  className = '',
  showCategory = true,
  showDate = true,
}) => {
  if (items.length === 0) return null;

  return (
    <div className={cn('grid gap-4', className)}>
      {items.map((item, index) => {
        const categorySlug = item.category?.toLowerCase() || 'all';
        const formattedDate = formatNewsDate(item.published_at, 'dd MMM yyyy');
        const imageKey = item.image ? item.image.split('/').pop() : null;

        return (
          <div key={item.id || index} className="group relative flex gap-4">
            {/* Image */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
              <Link href={`/${categorySlug}/${item.slug}`} className="block h-full">
                {imageKey ? (
                  <BlobImage
                    imageKey={imageKey}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <span className="text-xs text-gray-400">No Image</span>
                  </div>
                )}
              </Link>
            </div>

            {/* Content */}
            <div className="flex-1">
              {showCategory && item.category && (
                <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-primary">
                  {item.category}
                </span>
              )}
              <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug">
                <Link 
                  href={`/${categorySlug}/${item.slug}`}
                  className="text-gray-900 transition-colors hover:text-primary dark:text-gray-100"
                >
                  {item.title}
                </Link>
              </h3>
              {showDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeatSecondNewsCard;
