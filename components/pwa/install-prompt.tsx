// app/components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePWAContext } from './pwa-provider';
import { isIOSDevice } from '@/lib/pwa-utils';

export function InstallPrompt() {
  const { isInstalled, canInstall, showInstallPrompt } = usePWAContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Initialize state from localStorage on mount
  useEffect(() => {
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        setIsDismissed(true);
      }
    };
    
    // Use requestIdleCallback to defer non-critical work
    const id = requestIdleCallback(checkDismissed);
    return () => cancelIdleCallback(id);
  }, []);

  const handleInstall = async () => {
    const result = await showInstallPrompt();
    if (result.success && result.installed) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleIOSPrompt = () => {
    setShowIOSInstructions(true);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // iOS specific prompt
  if (isIOSDevice()) {
    return (
      <AnimatePresence>
        {!showIOSInstructions ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
          >
            <Card className="border-2 border-primary/20 bg-background/95 backdrop-blur-sm p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    Uygulamayı Ana Ekrana Ekle
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get the best experience by installing our app on your device.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleIOSPrompt}
                      className="flex-1"
                    >
                      Nasıl Yapılır?
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <Card
              className="max-w-md bg-background p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  iOS&apos;ta Nasıl Yüklenir
                </h3>
                <div className="space-y-3 text-left text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      1
                    </span>
                    <p>
                      Safari&apos;de <strong>Paylaş</strong> düğmesine dokunun{' '}
                      <span className="inline-block" aria-hidden="true">
                        <svg className="inline h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      2
                    </span>
                    <p>
                      <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini bulun{' '}
                      <span className="inline-block text-lg" aria-hidden="true">➕</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      3
                    </span>
                    <p>
                      Sağ üst köşedeki <strong>&quot;Ekle&quot;</strong> düğmesine dokunun
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowIOSInstructions(false);
                    handleDismiss();
                  }}
                  className="mt-6 w-full"
                >
                  Anladım
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Chrome/Android prompt
  if (!canInstall) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
      >
        <Card className="border-2 border-primary/20 bg-background/95 backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Uygulamayı Yükle
              </h3>
              <p className="text-sm text-muted-foreground">
                Add this app to your home screen for a better experience. Tap the share
                button and select &apos;Add to Home Screen&apos;.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Yükle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}