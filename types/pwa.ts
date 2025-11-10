// types/pwa.ts

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    url?: string;
    articleId?: string;
    category?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PWAContextType {
  isSupported: boolean;
  isInstalled: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  loading: boolean;
  canInstall: boolean;
  subscribe: () => Promise<{ success: boolean; error?: string }>;
  unsubscribe: () => Promise<{ success: boolean; error?: string }>;
  showInstallPrompt: () => Promise<{
    success: boolean;
    installed?: boolean;
    error?: string;
  }>;
}