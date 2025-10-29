// components/bento/NewsCard.tsx
import { useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import BlobImage from '@/components/BlobImage'; // BlobImage genel bir bileşen olduğu için root'dan import ediliyor
import type { NewsItem } from '@/types/news';

interface NewsCardProps {
  item: NewsItem;
  isMain?: boolean;
  isMiddle?: boolean;
  isList?: boolean;
  hideDescription?: boolean;
  className?: string;
  showCategory?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  showExcerpt?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const NewsCard = ({
  item,
  isMain = false,
  isMiddle = false,
  isList = false,
  hideDescription = false,
  className = '',
  showCategory = false,
  showDate = false,
  showReadTime = false,
  showExcerpt = false,
  size = 'medium',
}: NewsCardProps) => {
  // Memoize the image key to prevent unnecessary recalculations
  const imageKey = useMemo(() => item.image?.split('/').pop(), [item.image]);

  // Memoize the link URL to prevent recreation on every render
  const href = useMemo(() => `/${item.category}/${item.slug || item.id}`, [item.category, item.slug, item.id]);

  // Memoize the title to prevent recreation on every render
  const title = useMemo(() => item.seo_title || 'No title available', [item.seo_title]);

  // Memoize the description to prevent recreation on every render
  const description = useMemo(() =>
    item.seo_description || item.tldr?.[0] || 'No description available',
    [item.seo_description, item.tldr]
  );

  // Memoize the card class names to prevent recreation on every render
  const cardClasses = useMemo(() => cn(
    'group relative overflow-hidden rounded-xl cursor-pointer h-full',
    'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
    className
  ), [className]);

  if (isList) {
    return (
      <Link
        href={href}
        className={cardClasses}
      >
        <div className="flex h-full p-3 gap-3">
          <div className="w-1/3 h-full">
            <div className="relative w-full h-full rounded-lg overflow-hidden aspect-square">
              <BlobImage
                imageKey={imageKey}
                alt={title}
                width={400}
                height={300}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                loading={isMain ? 'eager' : 'lazy'} // Lazy load non-main images
              />
            </div>
          </div>
          <div className="w-2/3 flex flex-col justify-center">
            <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  if (isMiddle) {
    return (
      <Link
        href={`/${item.category}/${item.slug || item.id}`}
        className={cn(
          'group relative overflow-hidden rounded-xl cursor-pointer h-full',
          'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
          className
        )}
      >
        <div className="relative w-full h-full">
          <BlobImage
            imageKey={imageKey}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading={isMain ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-lineer-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-primary-300 transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  const titleSize = isMain ? 'text-3xl' : 'text-base';
  const imageAspect = isMain ? 'aspect-[16/9]' : isList ? 'aspect-square' : 'aspect-[2/1]';

  return (
    <Link
      href={href}
      className={cardClasses}
    >
      <div className="flex flex-col h-full">
        <div className={cn('relative w-full', imageAspect)}>
          <BlobImage
            imageKey={imageKey}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading={isMain ? 'eager' : 'lazy'}
          />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className={cn(
            'font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors',
            titleSize
          )}>
            {title}
          </h3>
          {!hideDescription && size === 'large' && (
            <p className="text-muted-foreground text-md line-clamp-3">
              {description}
            </p>
          )}
          {showCategory && item.category && (
            <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
          )}
          {showDate && item.published_at && (
            <p className="text-xs text-muted-foreground">{new Date(item.published_at).toLocaleDateString()}</p>
          )}
          {showReadTime && item.read_time && (
            <p className="text-xs text-muted-foreground">{item.read_time} min read</p>
          )}
        </div>
      </div>
    </Link>
  );
};

NewsCard.displayName = 'NewsCard';

export default memo(NewsCard);