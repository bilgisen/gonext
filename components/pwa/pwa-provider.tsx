// components/pwa/pwa-provider.tsx
'use client';

import { createContext, useContext } from 'react';
import type { PWAContextType } from '@/types/pwa';
import { usePWA } from '@/hooks/use.pwa'; // Updated import path

const PWAContext = createContext<PWAContextType | null>(null);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWA();

  return (
    <PWAContext.Provider value={pwa}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
}