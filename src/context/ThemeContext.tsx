import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeConfig } from '../types/theme';

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  theme: ThemeConfig;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, theme: initialTheme }) => {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 