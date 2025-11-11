// lib/news/notification-scheduler.ts
import { db } from '@/db';
import { news, news_categories, media } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { notifyNewArticle } from '@/lib/notifications/auto-notify';

// Türkiye kategorisi ID'si (veritabanınızdaki ID'ye göre güncelleyin)
const TURKEY_CATEGORY_ID = 13;

// Son kontrol zamanını saklamak için
let lastNotificationCheck = new Date();

// Yeni haberleri kontrol et ve bildirim gönder
export async function checkAndSendNewArticleNotifications() {
  try {
    const now = new Date();
    
    // Son kontrolden bu yana eklenen ve daha önce bildirilmemiş yeni haberleri bul
    const newArticles = await db
      .select()
      .from(news)
      .where(
        and(
          gte(news.published_at, lastNotificationCheck),
          eq(news.status, 'published') as any, // Type assertion for Drizzle ORM
          eq(news.visibility, 'public') as any,
          eq(news.is_notified, false) as any  // Sadece daha önce bildirilmemiş haberler
        )
      )
      .orderBy(news.published_at);

    // Son kontrol zamanını güncelle
    lastNotificationCheck = now;

    // Her bir haber için bildirim gönder
    for (const article of newArticles) {
      try {
        // Haberin kategorilerini al
        const articleCategories = await db
          .select()
          .from(news_categories)
          .where(eq(news_categories.news_id, article.id));

        // Eğer hiç kategori yoksa veya Türkiye kategorisi yoksa atla
        if (!articleCategories.some(cat => cat.category_id === TURKEY_CATEGORY_ID)) {
          continue;
        }

        // Haber için bildirim verilerini hazırla
        const notificationData = {
          id: article.id.toString(),
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || '',
          category: 'turkiye',
          imageUrl: '/default-news.jpg',
          isBreaking: false
        };

        // Eğer haberin ana medyası varsa, onu al
        if (article.main_media_id) {
          const [mainMedia] = await db
            .select()
            .from(media)
            .where(eq(media.id, article.main_media_id))
            .limit(1);
          
          if (mainMedia?.storage_path) {
            notificationData.imageUrl = mainMedia.storage_path;
          }
        }

        // Bildirimi gönder
        await notifyNewArticle(notificationData);

        // Bildirimin gönderildiğini işaretle
        await db
          .update(news)
          .set({ is_notified: true })
          .where(eq(news.id, article.id));

        console.log(`Bildirim gönderildi ve işaretlendi: ${article.title}`);
        
        // Çok fazla istekten kaçınmak için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Haber bildirimi gönderilirken hata (${article.id}):`, error);
      }
    }

    return { success: true, count: newArticles.length };
  } catch (error: any) {
    console.error('Bildirim kontrolü sırasında hata:', error);
    return { success: false, error: error.message };
  }
}