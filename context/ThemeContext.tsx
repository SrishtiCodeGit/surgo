import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeKey } from '@/types';
import { getTheme } from '@/lib/theme';

const THEME_STORAGE_KEY = '@velo_theme';

interface ThemeContextValue {
  theme: Theme;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => Promise<void>;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('balanced');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored && (stored === 'soft' || stored === 'balanced' || stored === 'hardcore')) {
          setThemeKey(stored as ThemeKey);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setTheme = async (key: ThemeKey) => {
    setThemeKey(key);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, key);
  };

  return (
    <ThemeContext.Provider
      value={{ theme: getTheme(themeKey), themeKey, setTheme, isLoaded }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
