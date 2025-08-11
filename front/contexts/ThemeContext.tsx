import React, { createContext, useContext, ReactNode } from 'react';
import { useManualTheme } from '@/hooks/useManualTheme';
import { Colors } from '@/constants/Colors';

interface ThemeContextType {
  currentTheme: 'light' | 'dark';
  colors: typeof Colors.light;
  isManualMode: boolean;
  manualDarkMode: boolean;
  toggleManualMode: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeData = useManualTheme();
  const colors = Colors[themeData.currentTheme ?? 'light'];

  const contextValue: ThemeContextType = {
    currentTheme: themeData.currentTheme ?? 'light',
    colors,
    isManualMode: themeData.isManualMode,
    manualDarkMode: themeData.manualDarkMode,
    toggleManualMode: themeData.toggleManualMode,
    toggleDarkMode: themeData.toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 