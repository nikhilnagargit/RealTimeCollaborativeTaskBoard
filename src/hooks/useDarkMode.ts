/**
 * Custom Hook: useDarkMode
 * 
 * Manages dark mode state with localStorage persistence and system preference detection.
 * Automatically applies dark mode class to document body.
 */

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const useDarkMode = (): [boolean, () => void] => {
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Use localStorage with system preference as default
  const [isDark, setIsDark] = useLocalStorage<boolean>('darkMode', prefersDark);

  /**
   * Toggle dark mode
   */
  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  /**
   * Apply dark mode class to body
   */
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  /**
   * Listen for system preference changes
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const storedPreference = localStorage.getItem('darkMode');
      if (!storedPreference) {
        setIsDark(e.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [setIsDark]);

  return [isDark, toggleDarkMode];
};
