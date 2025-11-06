// hooks/useArticleInteractions.ts (Güncellenmiş - useUserBookmarks tanımı kaldırıldı)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Bookmark hook'ları
export function useBookmarkStatus(newsId: string | number) {
  return useQuery({
    queryKey: ['bookmark-status', newsId],
    queryFn: async () => {
      const response = await fetch(`/api/news/${newsId}/bookmark`);
      if (!response.ok) {
        if (response.status === 401) {
          return { success: true, bookmarked: false, newsId };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookmark status');
      }
      return response.json();
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: string | number) => {
      const response = await fetch(`/api/news/${newsId}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle bookmark');
      }

      return response.json();
    },
    onSuccess: (_, newsId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', newsId] });
      // 'user-bookmarks' ile başlayan TÜM query key'leri geçersiz kıl
      // Bu, userId ve limit'e bakmadan çalışır
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'user-bookmarks'
      });
    },
  });
}

// Favori hook'ları (ileride eklenecek)
// export function useFavoriteStatus(newsId: string | number) { ... }
// export function useToggleFavorite() { ... }