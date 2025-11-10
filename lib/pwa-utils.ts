// lib/pwa-utils.ts

// Check for service worker updates
// This function should be called after registration to check for updates
export async function checkForServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  try {
    // Check for updates in the background
    const newRegistration = await registration.update();
    
    // If there's a new service worker waiting, notify the user
    if (newRegistration.waiting) {
      console.log('New service worker waiting to activate');
      // You can add a toast or UI notification here to prompt the user to update
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for service worker updates:', error);
    return false;
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPWASupported()) {
    console.warn('Service workers or Push API not supported');
    return null;
  }

  try {
    // First unregister any existing service workers to avoid conflicts
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('Service Worker registered successfully:', registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available, reload to update');
            // You can show a toast notification here to inform user
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('serviceWorkerUpdate', { detail: { registration } });
              window.dispatchEvent(event);
            }
          }
        });
      }
    });

    // Check for updates immediately
    await checkForServiceWorkerUpdate(registration);

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    // If registration fails, try to unregister any existing service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    return true;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'unknown';
  return navigator.userAgent;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
}

export function canShowNotificationPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if notifications are supported
  if (!('Notification' in window)) return false;
  
  // Check if permission is already granted or denied
  if (Notification.permission === 'denied') return false;
  if (Notification.permission === 'granted') return false;
  
  // Check if the user has previously dismissed the prompt
  if (localStorage.getItem('notification-permission-dismissed') === 'true') {
    return false;
  }
  
  // Only show the prompt on secure contexts
  return window.isSecureContext;
}

// Mark notification prompt as dismissed
export function dismissNotificationPrompt(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('notification-permission-dismissed', 'true');
  }
}

// Reset notification prompt dismissal
export function resetNotificationPrompt(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('notification-permission-dismissed');
  }
}