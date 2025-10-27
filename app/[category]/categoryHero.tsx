import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
import Link from 'next/link';

interface CategoryHeroProps {
  news: {
    id: string;
    category: string;
    slug?: string;
    seo_title: string;
    image?: string;
    read_time?: number;
  };
  variant?: 'large' | 'small';
  className?: string;
}

export function CategoryHero({ news, variant = 'large', className }: CategoryHeroProps) {
  const imageKey = news.image ? news.image.split('/').pop() : null;

  const cardContent = (
    <div className="relative w-full h-[400px] md:h-[350px] lg:h-[400px] overflow-hidden rounded-xl group">
      {imageKey ? (
        <BlobImage
          imageKey={imageKey}
          alt={news.seo_title || 'News image'}
          width={1200}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {news.read_time && (
        <div className="absolute top-6 right-6 z-10">
          <span className="px-3 py-1.5 bg-black/60 text-white rounded-lg text-sm font-medium backdrop-blur-sm">
            {news.read_time} min read
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <h1 className={cn(
          'font-bold text-white leading-tight mb-4 max-w-4xl',
          variant === 'large' 
            ? 'text-3xl md:text-4xl lg:text-5xl' 
            : 'text-2xl md:text-xl lg:text-3xl'
        )}>
          {news.seo_title}
        </h1>
      </div>
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      <Link href={`/${news.category}/${news.slug || news.id}`}>
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl cursor-pointer',
            'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
            'dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
            'hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_4px_8px_rgba(0,0,0,.1),0_16px_32px_rgba(0,0,0,.1)]',
            'hover:dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset,0_0_0_1px_rgba(255,255,255,.1),0_4px_8px_rgba(0,0,0,.2)]',
            'transition-all duration-300'
          )}
        >
          {cardContent}
        </div>
      </Link>
    </div>
  );
}
