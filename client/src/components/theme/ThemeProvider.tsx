import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Helper to safely get localStorage in browser
const getLocalStorage = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// Helper to safely check for system preferences
const getSystemThemePreference = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch (error) {
    return 'light';
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  
  // Initialize theme once on mount
  useEffect(() => {
    const savedTheme = getLocalStorage('theme', '');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme as Theme);
    } else {
      const systemTheme = getSystemThemePreference();
      setTheme(systemTheme);
    }
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    // Save theme to localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Failed to set theme in localStorage', error);
    }
    
    // Apply theme to the document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Prevent flash of incorrect theme (FOUC) by rendering
  // only after client-side mounting
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}