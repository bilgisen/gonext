import { QueryClient } from '@tanstack/react-query';

// QueryClient with optimized defaults for news application
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Garbage collection time - how long unused queries stay in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Don't refetch on window focus for news (read-only content)
      refetchOnWindowFocus: false,

      // Do refetch on reconnect (network comes back)
      refetchOnReconnect: true,

      // Retry failed requests once
      retry: 1,

      // Network mode - when to run queries
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',
    },
  },
});
