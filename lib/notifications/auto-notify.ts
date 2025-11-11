// lib/notifications/auto-notify.ts
'use server';

import { sendNotificationToAll } from '@/app/actions/actions';
import type { NotificationPayload } from '@/types/pwa';

/**
 * Send automatic notification when new article is published
 */
export async function notifyNewArticle(article: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  imageUrl?: string;
  isBreaking?: boolean;
}) {
  // Send notification only for "Turkey" category
  if (article.category !== 'turkiye') {
    console.log('Category is not Turkiye, notification not sent');
    return { success: false, reason: 'wrong_category' };
  }

  // Prepare notification content
  const payload: NotificationPayload = {
    title: article.isBreaking ? `🔴 Breaking: ${article.title}` : article.title,
    body: article.excerpt || 'Click to read details',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: article.imageUrl,
    data: {
      url: `/turkiye/${article.slug}`,
      articleId: article.id,
      category: article.category,
    },
    tag: `news-${article.id}`,
    requireInteraction: article.isBreaking || false,
    actions: [
      {
        action: 'view',
        title: 'Read News',
      },
      {
        action: 'share',
        title: 'Share',
      },
    ],
  };

  // Send notification
  const result = await sendNotificationToAll(payload);

  if (result.success) {
    console.log(`✅ Notification sent: to ${result.sent} users`);
  } else {
    console.error('❌ Notification failed:', result.error);
  }

  return result;
}

/**
 * Send notification by category
 */
export async function notifyByCategory(
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    category: string;
    imageUrl?: string;
  },
  categories: string[] // Which categories to send notifications for
) {
  if (!categories.includes(article.category)) {
    return { success: false, reason: 'category_not_in_list' };
  }

  const payload: NotificationPayload = {
    title: article.title,
    body: article.excerpt || 'New news published',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: article.imageUrl,
    data: {
      url: `/turkiye/${article.slug}`,
      articleId: article.id,
      category: article.category,
    },
    tag: `news-${article.id}`,
  };

  return await sendNotificationToAll(payload);
}

/**
 * Send notification only for breaking news
 */
export async function notifyIfBreaking(article: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  imageUrl?: string;
  isBreaking: boolean;
}) {
  if (!article.isBreaking) {
    return { success: false, reason: 'not_breaking' };
  }

  const payload: NotificationPayload = {
    title: `🔴 BREAKING: ${article.title}`,
    body: article.excerpt || 'Breaking news! Read details.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: article.imageUrl,
    data: {
      url: `/turkiye/${article.slug}`,
      articleId: article.id,
      category: article.category,
    },
    tag: `breaking-${article.id}`,
    requireInteraction: true, // Show until user dismisses
    actions: [
      {
        action: 'view',
        title: 'Read Now',
      },
    ],
  };

  return await sendNotificationToAll(payload);
}

/**
 * Scheduled notification (e.g., morning summary at 9 AM)
 */
export async function scheduleDigestNotification(articles: Array<{
  title: string;
  slug: string;
  category: string;
}>) {
  const topArticles = articles.slice(0, 3);

  const payload: NotificationPayload = {
    title: '📰 Today\'s Top News',
    body: topArticles.map((a) => `• ${a.title}`).join('\n'),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: '/turkiye',
    },
    tag: 'daily-digest',
  };

  return await sendNotificationToAll(payload);
}