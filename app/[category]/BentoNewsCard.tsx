import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface BentoNewsCardProps {
  news: any;
  index: number;
}


export function BentoNewsCard({ news }: BentoNewsCardProps) {
  const imageKey = news.image ? news.image.split('/').pop() || '' : '';
  
  // Get the category slug, ensuring it's in the correct format
  const getCategorySlug = (): string => {
    // If the category is an object with a slug property, use that
    if (news.category && typeof news.category === 'object' && 'slug' in news.category) {
      return (news.category as any).slug || 'turkiye';
    }
    // If it's a string, try to convert it to a slug
    if (typeof news.category === 'string') {
      return news.category.toLowerCase() === 'türkiye' ? 'turkiye' : news.category.toLowerCase();
    }
    // Default to 'turkiye' if no valid category is found
    return 'turkiye';
  };
  
  const categorySlug = getCategorySlug();
  
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
  ].reduce((result, date) => {
    if (result) return result; // If we already have a valid date, keep it
    if (!date) return '';       // Skip if date is null/undefined
    
    const d = new Date(date);
    // Only accept dates after 2001 (or any reasonable threshold)
    return (d.getFullYear() > 2001) ? formatDate(date) : '';
  }, '');

  // 4-column grid item
  const gridClass = 'col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-3 h-full';

  const cardContent = (
    <div className="flex flex-col w-full h-full overflow-hidden rounded-md group">
      <div className="relative w-full aspect-video overflow-hidden">
        {imageKey ? (
          <BlobImage
            imageKey={imageKey}
            alt={news.seo_title || 'News image'}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="33vw"
          />
        ) : (
          <div className="h-full w-full bg-card" />
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-tight line-clamp-2 mb-2">
          {news.seo_title}
        </h3>
        
        {/* Description */}
        {news.seo_description && (
          <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {news.seo_description}
          </p>
        )}
        
        {/* Date and Read Time */}
        {(formattedDate || news.read_time) && (
          <div className="mt-auto pt-1 text-xs text-muted-foreground flex items-center gap-4">
            {formattedDate && (
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formattedDate}
              </span>
            )}
            {news.read_time && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {news.read_time} min read
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Link href={`/${categorySlug}/${news.slug || news.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-md cursor-pointer bg-card',
          'transition-all duration-300 shadow-sm hover:shadow-md',
          gridClass
        )}
      >
        {cardContent}
      </div>
    </Link>
  );
}
