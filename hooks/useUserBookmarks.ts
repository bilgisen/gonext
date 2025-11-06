// hooks/useUserBookmarks.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';

export interface Bookmark {
  id: number;
  user_id: string;
  created_at: string;
  news: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    published_at: string | null;
    created_at: string;
    main_media?: {
      id: number;
      url: string | null;
      alt: string | null;
      width: number | null;
      height: number | null;
    } | null;
  };
}

export function useUserBookmarks(limit: number = 10) {
  const { data: session } = useSession();

  return useQuery<Bookmark[]>({
    queryKey: ['user-bookmarks', session?.user?.id, limit],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      try {
        const response = await fetch(`/api/user/bookmarks?limit=${limit}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Failed to fetch bookmarks');
        }
        
        const { bookmarks } = await response.json();
        return bookmarks || [];
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
      }
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}