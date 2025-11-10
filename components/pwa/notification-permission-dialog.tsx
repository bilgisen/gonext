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
              title: 'Notifications Enabled',
              description: 'You will now receive instant breaking news notifications.',
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
              title: 'Error',
              description: result?.error || 'An error occurred while enabling notifications.',
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
            title: 'Error',
            description: 'An error occurred while enabling notifications. Please try again later.',
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
        <Card className="relative max-w-md w-full mx-4 bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Enable Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow notifications to receive instant breaking news updates.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mt-1 -mr-2"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                Later
              </Button>
              <Button
                onClick={handleAllow}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Allow'
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}