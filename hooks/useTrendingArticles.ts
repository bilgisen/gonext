// hooks/useTrendingArticles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TrendingArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  published_at: string;
  created_at: string;
  view_count: number;
  trending_score?: number;
}

export function useTrendingArticles(period: Period = 'daily', limit: number = 10) {
  return useQuery<TrendingArticle[]>({
    queryKey: ['trending-articles', period, limit],
    queryFn: async () => {
      try {
        const url = `/api/news/trending?period=${period}&limit=${limit}&t=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending articles');
        }
        
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error('Error fetching trending articles:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// View recording mutation
export function useRecordArticleView() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: {
      articleId: string | number;
      options?: {
        onSuccess?: (data: any) => void;
        onError?: (error: Error) => void;
      };
    }) => {
      const { articleId, options } = variables;
      const startTime = Date.now();
      const requestId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Log the incoming articleId
      console.log(`[${requestId}] 📥 Received view request for article:`, { 
        articleId, 
        type: typeof articleId,
        timestamp: new Date().toISOString() 
      });
      
      // Validate articleId
      const numericArticleId = Number(articleId);
      const isValidId = !isNaN(numericArticleId) && numericArticleId > 0 && 
                       Number.isInteger(numericArticleId) && 
                       articleId?.toString().trim() === numericArticleId.toString();
      
      if (!isValidId) {
        const error = new Error(`Invalid article ID: ${articleId} (parsed as ${numericArticleId})`);
        console.error(`[${requestId}] ❌ ${error.message}`, { 
          articleId, 
          numericArticleId,
          type: typeof articleId,
          isNaN: isNaN(numericArticleId),
          isInteger: Number.isInteger(numericArticleId),
          isPositive: numericArticleId > 0,
          stringMatch: articleId?.toString().trim() === numericArticleId.toString()
        });
        
        options?.onError?.(error);
        return { success: false, error: error.message };
      }

      try {
        const url = `/api/news/${numericArticleId}/view`;
        console.log(`[${requestId}] 📤 Sending view request to: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          },
        });

        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
          console.error(`[${requestId}] ❌ View recording failed in ${responseTime}ms:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            url
          });
          throw error;
        }

        console.log(`[${requestId}] ✅ View recorded successfully in ${responseTime}ms`);
        
        // Invalidate the trending articles query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['trending-articles'] });
        
        return { success: true };
      } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`[${requestId}] ❌ Error recording view after ${errorTime}ms:`, error);
        
        // Rethrow the error to be handled by the caller
        throw error;
      }
    },
  });
}