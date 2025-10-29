import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NewsItem } from '@/types/news';
import { formatNewsDate } from '@/lib/utils/date-utils';
import { Calendar, Clock } from 'lucide-react';
import BlobImage from '@/components/BlobImage'; // BlobImage genel bir bileşen olduğu için root'dan import ediliyor

interface FrontCategoryMainNewsCardProps {
  item: NewsItem;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
}

const FrontCategoryMainNewsCard: React.FC<FrontCategoryMainNewsCardProps> = ({
  item,
  className = '',
  showCategory = true,
  showDate = true,
  showReadTime = true,
}) => {
  const categorySlug = item.category?.toLowerCase() || 'all';
  const formattedDate = formatNewsDate(item.published_at, 'dd MMMM yyyy');
    
  // Extract the image key from the URL if it's a full URL
  const imageKey = item.image ? item.image.split('/').pop() : null;

  return (
    <div className={cn('group relative overflow-hidden rounded-lg bg-card shadow-sm transition-shadow hover:shadow-md', className)}>
      <Link href={`/${categorySlug}/${item.slug}`} className="block h-full">
        <div className="relative h-48 w-full overflow-hidden md:h-60 lg:h-72">
          {imageKey ? (
            <BlobImage
              imageKey={imageKey}
              alt={item.image_title || item.seo_title || 'News Image'}
              width={800}
              height={600}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-muted/30">
                  <span className="text-muted-foreground">Image not available</span>
                </div>
              }
            />
          ) : (
            <div className="flex h-full/50 w-full items-center justify-center bg-muted/30">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-lineer-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            {showCategory && item.category && (
              <span className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-medium">
                {item.category}
              </span>
            )}
            
            <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-white md:text-xl">
              {item.seo_title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              {showDate && item.published_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </div>
              )}
              
              {showReadTime && item.read_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.read_time} min</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FrontCategoryMainNewsCard;
