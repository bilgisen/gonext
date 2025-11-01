'use client';

import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useRef } from 'react';

/**
 * Custom hook to determine if the component has mounted on the client
 * This avoids the need for state updates in effects
 */
function useIsMounted() {
  const isMounted = useRef(false);
  
  // This runs after the first render on the client
  if (typeof window !== 'undefined') {
    isMounted.current = true;
  }
  
  return isMounted.current;
}

export function ThemeToggle() {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // On the server, render a placeholder with matching dimensions
  if (!isMounted) {
    return (
      <Button 
        size="icon" 
        variant="outline" 
        className="w-9 h-9" 
        aria-hidden="true"
        disabled
      >
        <div className="h-4 w-4" />
      </Button>
    );
  }

  // On the client, render the actual theme toggle
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
    </Button>
  );
}
