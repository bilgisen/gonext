// components/BookmarkButton.tsx
'use client';

import { useBookmarkStatus, useToggleBookmark } from '@/hooks/useArticleInteractions';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  newsId: string | number;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

const BookmarkButton = ({
  newsId,
  showLabel = true,
  className = '',
  iconClassName = ''
}: BookmarkButtonProps) => {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const toggleBookmark = useToggleBookmark();
  
  // Set up the query
  const { data, isLoading: statusLoading } = useBookmarkStatus(newsId);

  const handleBookmark = async () => {
    if (typeof window === 'undefined') return;

    if (!sessionData?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    toggleBookmark.mutate(newsId);
  };

  const isBookmarked = data?.bookmarked;
  const isLoading = statusLoading || toggleBookmark.isPending;
  
  // On server-side, render a disabled button
  if (typeof window === 'undefined') {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium opacity-50',
          className
        )}
      >
        <Bookmark className={cn('h-5 w-5', iconClassName)} />
        {showLabel && <span>Bookmark</span>}
      </button>
    );
  }
  
  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium transition-colors',
        'hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add to bookmarks'}
    >
      <Bookmark
        className={cn(
          'h-5 w-5',
          isBookmarked ? 'fill-current' : 'fill-none',
          iconClassName
        )}
      />
      {showLabel && (
        <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
      )}
    </button>
  );
}

export default BookmarkButton;