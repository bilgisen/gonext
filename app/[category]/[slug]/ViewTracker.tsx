// app/[category]/[slug]/ViewTracker.tsx
'use client';

import { useEffect } from 'react';
import { useRecordArticleView } from '@/hooks/useTrendingArticles';

interface ViewTrackerProps {
  newsId: number | string; // newsId hala string veya number olabilir
}

export function ViewTracker({ newsId }: ViewTrackerProps) {
  const { mutate: recordView } = useRecordArticleView();

  useEffect(() => {
    // --- YENİ: newsId'nin geçerli olup olmadığını burada kontrol edin ---
    // newsId tanımlı mı, falsy değil mi, ve sayıya çevrilebilir mi?
    const numericId = Number(newsId);
    if (typeof window === 'undefined' || !newsId || isNaN(numericId) || numericId <= 0) {
      console.warn(`[ViewTracker] Invalid or missing newsId prop: ${newsId}. Skipping view recording.`);
      return; // Geçersizse useEffect işlemine devam etme
    }
    // --- KONTROL BİTTİ ---

    // Check if we've already recorded a view recently using localStorage
    const storageKey = `view:${numericId}`; // Sayıya çevrilen ID'yi kullan
    const lastView = localStorage.getItem(storageKey);
    const lastViewTime = lastView ? parseInt(lastView, 10) : 0;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour

    if (now - lastViewTime < oneHour) {
      console.log(`[ViewTracker] View for newsId ${numericId} already recorded recently in localStorage.`);
      return;
    }

    const recordViewWithDelay = () => {
      console.log(`[ViewTracker] Attempting to record view for newsId ${numericId} after delay.`);
      recordView(
        { 
          articleId: numericId, // Hook'taki doğrulamayı geçeceği garantilensin diye sayısal ID kullan
          options: {
            onSuccess: () => {
              console.log(`[ViewTracker] Successfully recorded view for newsId ${numericId}. Updating localStorage.`);
              localStorage.setItem(storageKey, now.toString());
              // Optional: Invalidate related queries after a successful view
              // queryClient.invalidateQueries({ queryKey: ['trending-articles'] });
            },
            onError: (error: Error) => {
              console.error(`[ViewTracker] View recording failed for newsId ${numericId}:`, error);
            }
          }
        }
      );
    };

    // Set a timeout to record the view after 2 seconds
    const timer = setTimeout(recordViewWithDelay, 2000);
    
    // Cleanup the timeout if the component unmounts before the timeout fires
    return () => {
      clearTimeout(timer);
      console.log(`[ViewTracker] Cleanup: Timer cleared for newsId ${numericId}.`);
    };
  }, [newsId, recordView]); // Include recordView in the dependency array

  return null;
}