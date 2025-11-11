// app/actions.ts
'use server';

import webpush from 'web-push';
import { auth } from '@/lib/auth'; // Your better-auth instance
import { db } from '@/db'; // Your Drizzle database instance
import { notificationSubscriptions } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { PushSubscriptionJSON, NotificationPayload } from '@/types/pwa';

// Configure VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * Subscribe user to push notifications
 * @param subscription - Push subscription details
 * @param userId - Optional user ID for authenticated users
 */
export async function subscribeUser(subscription: PushSubscriptionJSON, userId?: string) {
  try {
    // Check if subscription already exists
    const existingSubscription = await db.query.notificationSubscriptions.findFirst({
      where: eq(notificationSubscriptions.endpoint, subscription.endpoint),
    });

    if (existingSubscription) {
      // Update existing subscription
      const updateData: any = {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date(),
      };

      // Only include userId if it's provided
      if (userId) {
        updateData.userId = userId;
      }

      await db
        .update(notificationSubscriptions)
        .set(updateData)
        .where(eq(notificationSubscriptions.endpoint, subscription.endpoint));
    } else {
      // Create new subscription
      const insertData: any = {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      };

      // Only include userId if it's provided
      if (userId) {
        insertData.userId = userId;
      }

      await db.insert(notificationSubscriptions).values(insertData);
    }

    return { success: true };
  } catch (error) {
    console.error('Error subscribing user:', error);
    return { success: false, error: 'Failed to subscribe user' };
  }
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeUser(endpoint: string) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    await db
      .delete(notificationSubscriptions)
      .where(eq(notificationSubscriptions.endpoint, endpoint));

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return { success: false, error: 'Failed to unsubscribe user' };
  }
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
) {
  try {
    const subscriptions = await db.query.notificationSubscriptions.findMany({
      where: eq(notificationSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      return { success: false, error: 'No subscriptions found for user' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // If subscription is invalid, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db
              .delete(notificationSubscriptions)
              .where(eq(notificationSubscriptions.endpoint, sub.endpoint));
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Send notification to all subscribers (for breaking news)
 */
export async function sendNotificationToAll(payload: NotificationPayload) {
  try {
    // Get all active subscriptions
    const subscriptions = await db.query.notificationSubscriptions.findMany();

    if (subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return { success: false, error: 'No active subscriptions found' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // If subscription is invalid, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db
              .delete(notificationSubscriptions)
              .where(eq(notificationSubscriptions.endpoint, sub.endpoint));
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error('Error sending notification to all:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

/**
 * Send notification to premium subscribers only
 */
export async function sendNotificationToPremium(payload: NotificationPayload) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers()),
    });

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Get premium users with proper type safety
    const premiumUsers = await db.query.user.findMany({
      where: (user, { eq }) => eq(user.isPremium, true),
    });

    const premiumUserIds = premiumUsers.map((user) => user.id);

    if (premiumUserIds.length === 0) {
      return { success: false, error: 'No premium users found' };
    }

    const subscriptions = await db.query.notificationSubscriptions.findMany({
      where: inArray(notificationSubscriptions.userId, premiumUserIds),
    });

    if (subscriptions.length === 0) {
      return { success: false, error: 'No premium subscriptions found' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db
              .delete(notificationSubscriptions)
              .where(eq(notificationSubscriptions.endpoint, sub.endpoint));
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return {
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error('Error sending notification to premium users:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}

/**
 * Get user's notification subscriptions
 */
export async function getUserSubscriptions() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers()),
    });

    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    const subscriptions = await db.query.notificationSubscriptions.findMany({
      where: eq(notificationSubscriptions.userId, session.user.id),
    });

    return { success: true, subscriptions };
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return { success: false, error: 'Failed to get subscriptions' };
  }
}

/**
 * Get total subscription count (for admin dashboard)
 */
export async function getSubscriptionStats() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers()),
    });

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const allSubscriptions = await db.query.notificationSubscriptions.findMany();
    
    const uniqueUsers = new Set(allSubscriptions.map(sub => sub.userId));

    return {
      success: true,
      stats: {
        totalSubscriptions: allSubscriptions.length,
        uniqueUsers: uniqueUsers.size,
      },
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return { success: false, error: 'Failed to get stats' };
  }
}