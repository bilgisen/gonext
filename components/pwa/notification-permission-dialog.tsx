// components/pwa/notification-permission-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWAContext } from './pwa-provider';

interface NotificationPermissionDialogProps {
  delay?: number;
}

export function NotificationPermissionDialog({ delay = 5000 }: NotificationPermissionDialogProps) {
  const { isSupported, isSubscribed, subscribe } = usePWAContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const dismissed = typeof window !== 'undefined' 
      ? localStorage.getItem('notification-permission-dismissed') === 'true'
      : false;
    
    setIsDismissed(dismissed);
    
    // Only show if notifications are supported, not already subscribed, and not dismissed
    if (isSupported && !isSubscribed && !dismissed) {
      // Small delay to allow the page to load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);
      
      // Cleanup function to clear the timer
      return () => clearTimeout(timer);
    }
    
    // No cleanup needed if we don't set a timer
    return undefined;
  }, [isSupported, isSubscribed, delay]);

  const handleAllow = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await subscribe();
      if (result?.success) {
        setIsOpen(false);
        // Show success message
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('show-toast', {
            detail: {
              title: 'Bildirimler Aktif',
              description: 'Artık son dakika haberlerinden anında haberdar olacaksınız.',
              variant: 'default',
            },
          });
          window.dispatchEvent(event);
        }
      } else {
        // Show error message
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('show-toast', {
            detail: {
              title: 'Hata',
              description: result?.error || 'Bildirim izni verilirken bir hata oluştu.',
              variant: 'destructive',
            },
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('show-toast', {
          detail: {
            title: 'Hata',
            description: 'Bildirim izni verilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            variant: 'destructive',
          },
        });
        window.dispatchEvent(event);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    // Store dismissal in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-permission-dismissed', 'true');
    }
  };

  if (!isOpen || isSubscribed || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-4 right-4 z-50 w-full max-w-sm px-4 sm:px-0"
      >
        <Card className="border-2 border-primary/20 bg-background/95 backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-sm mb-1">📢 Son Dakika Haberleri Kaçırmayın</h3>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Önemli gelişmelerden anında haberdar olmak için bildirimlere izin verin. İstediğiniz zaman ayarlardan kapatabilirsiniz.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">Önemli gelişmeler</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">İlgi alanlarınıza özel içerikler</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">İstediğiniz zaman kapatabilirsiniz</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleAllow} 
                  className="w-full" 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      İşleniyor...
                    </span>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Bildirimleri Aç
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="w-full"
                  size="sm"
                  disabled={isLoading}
                >
                  Daha Sonra
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}