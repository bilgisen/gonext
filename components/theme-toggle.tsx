"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Set mounted state after component mounts (using setTimeout to avoid React warning)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until we're on the client
  if (!mounted) {
    return (
      <button 
        className="p-2 text-foreground"
        aria-label="Toggle theme"
        disabled
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-foreground hover:text-primary transition-colors"
      aria-label={label}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;