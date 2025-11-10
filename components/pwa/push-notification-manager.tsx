// app/components/pwa/push-notification-manager.tsx
'use client';

import { useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePWAContext } from './pwa-provider';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationManager() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading } = usePWAContext();
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);

    try {
      if (checked) {
        const result = await subscribe();
        
        if (result.success) {
          toast({
            title: '✅ Bildirimler Aktif',
            description: 'Artık son dakika haberlerden haberdar olacaksınız.',
          });
        } else {
          toast({
            title: '❌ Hata',
            description: result.error || 'Bildirimler aktif edilemedi.',
            variant: 'destructive',
          });
        }
      } else {
        const result = await unsubscribe();
        
        if (result.success) {
          toast({
            title: '🔕 Bildirimler Kapatıldı',
            description: 'Artık bildirim almayacaksınız.',
          });
        } else {
          toast({
            title: '❌ Hata',
            description: result.error || 'Bildirimler kapatılamadı.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: '❌ Beklenmeyen Hata',
        description: 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Card className="p-4 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <Label htmlFor="notifications" className="font-semibold cursor-pointer">
              Anlık Bildirimler
            </Label>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? 'Son dakika haberlerden haberdar olun'
                : 'Bildirimler kapalı'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(loading || isToggling) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={loading || isToggling}
          />
        </div>
      </div>
    </Card>
  );
}

// Compact version for header/navbar
export function PushNotificationToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading } = usePWAContext();
  const { toast } = useToast();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    try {
      if (isSubscribed) {
        const result = await unsubscribe();
        
        if (result.success) {
          toast({
            title: '🔕 Bildirimler Kapatıldı',
            description: 'Artık bildirim almayacaksınız.',
          });
        }
      } else {
        const result = await subscribe();
        
        if (result.success) {
          toast({
            title: '✅ Bildirimler Aktif',
            description: 'Artık son dakika haberlerden haberdar olacaksınız.',
          });
        }
      }
    } catch (error) {
      toast({
        title: '❌ Hata',
        description: 'Bir şeyler yanlış gitti.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      className="relative"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellRing className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </>
      ) : (
        <BellOff className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isSubscribed ? 'Bildirimleri Kapat' : 'Bildirimleri Aç'}
      </span>
    </Button>
  );
}