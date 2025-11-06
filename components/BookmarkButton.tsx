// components/BookmarkButton.tsx
'use client';

import { useBookmarkStatus, useToggleBookmark } from '@/hooks/useArticleInteractions';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client'; // better-auth client session hook
import { useState } from 'react';

interface BookmarkButtonProps {
  newsId: string | number;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

function BookmarkButton({
  newsId,
  showLabel = true,
  className = '',
  iconClassName = ''
}: BookmarkButtonProps) {
  const router = useRouter();
  const { data: sessionData } = useSession(); // better-auth client session hook
  const [isMounted, setIsMounted] = useState(false);
  const { data, isLoading: statusLoading } = useBookmarkStatus(newsId);
  const toggleBookmark = useToggleBookmark();
  
  // Using requestIdleCallback to defer non-critical work
  if (typeof window !== 'undefined' && !isMounted) {
    // This will run after the component mounts
    requestIdleCallback(() => {
      setIsMounted(true);
    });
  }

  const handleBookmark = async () => {
    if (typeof window === 'undefined') return;

    // --- YENİ KISIM: useSession hook'u ile oturum kontrolü ---
    if (!sessionData?.user) { // sessionData.user doğrudan kullanılabilir
      router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // --- YENİ KISIM BİTİŞ ---
    
    toggleBookmark.mutate(newsId);
  };

  const isBookmarked = data?.bookmarked;
  const isLoading = statusLoading || toggleBookmark.isPending;

  if (!isMounted) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 ${className} opacity-50`}
      >
        <Bookmark className={iconClassName} />
      </button>
    );
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={`flex items-center gap-2 ${className} ${
        isLoading ? 'opacity-50' : ''
      }`}
    >
      <Bookmark
        className={`${iconClassName} ${
          isBookmarked ? 'fill-current text-yellow-500' : ''
        }`}
      />
      {showLabel && (
        <span className="font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}

export default BookmarkButton;