// hooks/use-pwa.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPWASupported,
  isStandalone,
  registerServiceWorker,
  urlBase64ToUint8Array,
  requestNotificationPermission,
} from '@/lib/pwa-utils';
import { subscribeUser, unsubscribeUser } from '@/app/actions/actions';
import type { PushSubscriptionJSON } from '@/types/pwa';
import { toast } from '@/hooks/use-toast';

export function usePWA() {
  const [isSupported, setIsSupported] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize PWA
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Check if PWA is supported
        const supported = isPWASupported();
        setIsSupported(supported);
        
        const installed = isStandalone();
        setIsInstalled(installed);

        // Register service worker if supported
        if (supported) {
          try {
            const reg = await registerServiceWorker();
            if (!mounted || !reg) return;
            
            setRegistration(reg);

            // Check existing subscription
            const existingSub = await reg.pushManager.getSubscription();
            if (!mounted) return;
            
            setSubscription(existingSub);
            setIsSubscribed(!!existingSub);

            // Check for updates in the next tick to avoid blocking the main thread
            setTimeout(() => {
              reg.update().catch(console.error);
            }, 0);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
            toast({
              title: 'Servis Çalışanı Hatası',
              description: 'Bildirimler düzgün çalışmayabilir. Lütfen sayfayı yenileyin.',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // Only update if we don't have a deferred prompt
      if (!deferredPrompt) {
        setDeferredPrompt(e);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [deferredPrompt]);

  // Listen for appinstalled event
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!registration) {
      throw new Error('Servis çalışanı kaydı bulunamadı');
    }

    setLoading(true);

    try {
      // Request notification permission first
      const permission = await requestNotificationPermission();

      if (permission !== 'granted') {
        throw new Error('Bildirim izni reddedildi');
      }

      // Check if already subscribed
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        setSubscription(existingSub);
        setIsSubscribed(true);
        return { success: true };
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key bulunamadı');
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push manager
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      // Send subscription to server
      const subscriptionJSON = sub.toJSON() as PushSubscriptionJSON;
      const result = await subscribeUser(subscriptionJSON);

      if (!result.success) {
        throw new Error(result.error || 'Failed to subscribe');
      }

      setSubscription(sub);
      setIsSubscribed(true);

      return { success: true };
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setLoading(false);
    }
  }, [registration]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    setLoading(true);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove subscription from server
      const result = await unsubscribeUser(subscription.endpoint);

      if (!result.success) {
        throw new Error(result.error || 'Failed to unsubscribe');
      }

      setSubscription(null);
      setIsSubscribed(false);

      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Show install prompt
  const showInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      // If deferredPrompt is not available, return an error
      if (isStandalone()) {
        return { success: false, error: 'Uygulama zaten yüklü' };
      }
      return { success: false, error: 'Yükleme istemi şu anda kullanılamıyor' };
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      
      if (outcome === 'accepted') {
        // User accepted the install prompt
        toast({
          title: 'Yükleme Başlatıldı',
          description: 'Uygulama cihazınıza yükleniyor...',
        });
        return { success: true, installed: true };
      } else {
        // User dismissed the install prompt
        toast({
          title: 'Yükleme İptal Edildi',
          description: 'Uygulamayı daha sonra ana ekranınıza ekleyebilirsiniz.',
          variant: 'default',
        });
        return { success: false, error: 'Kullanıcı yüklemeyi iptal etti' };
      }
    } catch (error) {
      console.error('Yükleme istemi gösterilirken hata oluştu:', error);
      toast({
        title: 'Hata',
        description: 'Uygulama yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
      return { success: false, error: 'Yükleme istemi gösterilirken hata oluştu' };
    }
  }, [deferredPrompt]);

  return {
    isSupported,
    isInstalled,
    isSubscribed,
    subscription,
    loading,
    canInstall: !!deferredPrompt,
    subscribe,
    unsubscribe,
    showInstallPrompt,
  };
}