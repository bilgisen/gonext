import { cn } from '@/lib/utils';
import BlobImage from '@/components/BlobImage';
import Link from 'next/link';

interface BentoNewsCardProps {
  news: any;
  index: number;
}

/**
 * Tekrarlayan Bento Pattern (her 6 haberde tekrar eder)
 *
 * Pattern:
 * 0 -> büyük (2 sütun, 2 satır)
 * 1 -> küçük (1x1)
 * 2 -> küçük (1x1)
 * 3 -> yatay (3 sütun, 1 satır)
 * 4 -> küçük (1x1)
 * 5 -> küçük (1x1)
 */
export function BentoNewsCard({ news, index }: BentoNewsCardProps) {
  const imageKey = news.image ? news.image.split('/').pop() : null;
  const mod = index % 6;

  // Simple 3-column grid item
  const gridClass = 'col-span-full sm:col-span-1 lg:col-span-4 h-full';

  const cardContent = (
    <div className="relative w-full h-full overflow-hidden rounded-xl group">
      {imageKey ? (
        <BlobImage
          imageKey={imageKey}
          alt={news.seo_title || 'News image'}
          width={400}
          height={300}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="33vw"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {news.read_time && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-1 bg-black/60 text-white rounded text-xs font-medium backdrop-blur-sm">
            {news.read_time} min
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-base sm:text-lg font-semibold text-white leading-tight line-clamp-2">
          {news.seo_title}
        </h3>
      </div>
    </div>
  );

  return (
    <Link href={`/${news.category}/${news.slug || news.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl cursor-pointer',
          'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
          'dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
          'hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_4px_8px_rgba(0,0,0,.1),0_16px_32px_rgba(0,0,0,.1)]',
          'hover:dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset,0_0_0_1px_rgba(255,255,255,.1),0_4px_8px_rgba(0,0,0,.2)]',
          'transition-all duration-300',
          gridClass
        )}
      >
        {cardContent}
      </div>
    </Link>
  );
}
