'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';

export interface UserStats {
  totalReadingTime: number;
  readArticles: number;
  savedArticles: number;
  lastActive: string;
}

export function useUserStats() {
  const { data: session } = useSession();

  return useQuery<UserStats>({
    queryKey: ['user-stats', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      try {
        const response = await fetch('/api/user/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
      }
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
