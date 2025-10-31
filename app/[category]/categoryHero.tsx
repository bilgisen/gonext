import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface CategoryHeroProps {
  news: {
    id: string;
    category: string;
    slug?: string;
    seo_title: string;
    seo_description?: string;
    image?: string;
    read_time?: number;
    published_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  variant?: 'large' | 'small';
  className?: string;
}

export function CategoryHero({ news, variant = 'large', className }: CategoryHeroProps) {
  const imageKey = news.image ? news.image.split('/').pop() : null;
  
  // Format the date with time, only if it's a valid and non-default date
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if the date is invalid, default (1970), or specifically January 1, 2001
      if (isNaN(date.getTime()) || 
          date.getFullYear() <= 1970 || 
          (date.getFullYear() === 2001 && date.getMonth() === 0 && date.getDate() === 1)) {
        return '';
      }
      return format(date, 'MMMM d \'at\' HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Try to get the most recent valid date
  const formattedDate = [
    news.published_at,
    news.created_at,
    news.updated_at
  ].reduce<string>((result: string, date) => {
    if (result) return result; // If we already have a valid date, keep it
    if (!date) return '';       // Skip if date is null/undefined
    
    const d = new Date(date);
    // Only accept dates after 2001 (or any reasonable threshold)
    return (d.getFullYear() > 2001) ? formatDate(date) : '';
  }, '');

  const cardContent = (
    <div className={cn(
      'flex flex-col w-full overflow-hidden rounded-xl group relative',
      variant === 'small' ? 'h-full min-h-[300px]' : '' // Ensure small variant has minimum height
    )}>
      {variant === 'small' && imageKey ? (
        <div className="absolute inset-0 -z-10">
          <BlobImage
            imageKey={imageKey}
            alt={news.seo_title || 'News image'}
            width={800}
            height={500}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      ) : (
        <div className={cn(
          'relative w-full overflow-hidden',
          variant === 'large' && 'aspect-video'
        )}>
          {imageKey ? (
            <BlobImage
              imageKey={imageKey}
              alt={news.seo_title || 'News image'}
              width={1200}
              height={675}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="h-full w-full bg-card" />
          )}
        </div>
      )}

      <div className={cn(
        'p-5 md:p-6',
        variant === 'small' ? 'flex-1 flex flex-col justify-end text-white' : ''
      )}>
        <h1 
          className={cn(
            'font-bold leading-tight',
            variant === 'large' 
              ? 'text-2xl md:text-3xl lg:text-4xl text-foreground' 
              : 'text-xl md:text-2xl lg:text-3xl text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' // White text with shadow for better contrast
          )}
        >
          {news.seo_title}
        </h1>
        
        {/* Description - Only show for large variant */}
        {variant === 'large' && news.seo_description && (
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed line-clamp-2">
            {news.seo_description}
          </p>
        )}
        
        {/* Date and Read Time */}
        {(formattedDate || (variant === 'small' && news.read_time)) && (
          <div className={cn(
            'flex items-center gap-4 text-xs',
            variant === 'large' 
              ? 'pt-2 text-muted-foreground' 
              : 'pt-3 text-white/90' // Lighter white for better contrast
          )}>
            {formattedDate && (
              <span className="flex items-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {formattedDate}
              </span>
            )}
            {variant === 'small' && news.read_time && (
              <span className="flex items-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {news.read_time} min
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('w-full', className, {
      'h-full': variant === 'small'
    })}>
      <Link href={`/${news.category}/${news.slug || news.id}`} className={cn('block h-full', {
        'h-full': variant === 'small'
      })}>
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl cursor-pointer',
            'transition-all duration-300 shadow-sm hover:shadow-md',
            variant === 'small' ? 'h-full flex flex-col bg-transparent' : 'bg-card'
          )}
        >
          {cardContent}
        </div>
      </Link>
    </div>
  );
}
