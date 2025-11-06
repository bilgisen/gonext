// components/user/UserBookmarks.tsx
'use client';

import { useUserBookmarks } from '@/hooks/useUserBookmarks';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Bookmark as BookmarkIcon, BookmarkCheck } from 'lucide-react';
import { formatNewsDate } from '@/lib/utils/date-utils';
import BlobImage from '../BlobImage'; // Make sure this path is correct

export function UserBookmarks({ limit = 10 }: { limit?: number }) {
  const { data: session } = useSession();
  const { 
    data: bookmarks = [], 
    isLoading, 
    error 
  } = useUserBookmarks(limit);

  if (!session?.user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Saved Articles</CardTitle>
          <CardDescription>Sign in to view your saved articles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <BookmarkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No saved articles yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Click the bookmark icon on articles to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <Link 
          key={bookmark.id} 
          href={`/news/${bookmark.news.slug}`}
          className="block group"
        >
          <Card className="hover:bg-accent transition-colors overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {bookmark.news.main_media?.url && (
                <div className="relative w-full sm:w-40 h-40 sm:h-24 bg-muted">
                  <BlobImage
                    imageKey={bookmark.news.main_media.url}
                    alt={bookmark.news.main_media.alt || bookmark.news.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    width={bookmark.news.main_media.width || 160}
                    height={bookmark.news.main_media.height || 96}
                  />
                </div>
              )}
              <CardContent className="p-4 flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{bookmark.news.title}</h3>
                    {bookmark.news.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {bookmark.news.excerpt}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {bookmark.news.published_at && (
                        <time dateTime={new Date(bookmark.news.published_at).toISOString()}>
                          {formatNewsDate(bookmark.news.published_at)}
                        </time>
                      )}
                    </div>
                  </div>
                  <BookmarkCheck className="h-5 w-5 text-primary shrink-0" />
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}