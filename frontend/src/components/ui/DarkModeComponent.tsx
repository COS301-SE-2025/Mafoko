import React, { createContext, use, useState, useEffect } from 'react';
import { getUserPreferences, updateUserPreferences } from '../../services/settingsService';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode setting from backend on component mount
  useEffect(() => {
    const loadDarkModeSetting = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // User not logged in, use default
        return;
      }

      try {
        const preferences = await getUserPreferences();
        const darkModeValue = preferences.dark_mode;
        setIsDarkMode(darkModeValue);
        
        // Apply both dark mode classes to document for compatibility
        if (darkModeValue) {
          document.documentElement.classList.add('theme-dark');
          document.documentElement.classList.add('dark-mode');
          document.documentElement.classList.remove('theme-light');
        } else {
          document.documentElement.classList.add('theme-light');
          document.documentElement.classList.remove('theme-dark');
          document.documentElement.classList.remove('dark-mode');
        }
      } catch (err) {
        console.error('Failed to load dark mode setting:', err);
        // Continue with default (false) and apply light theme
        document.documentElement.classList.add('theme-light');
        document.documentElement.classList.remove('theme-dark');
        document.documentElement.classList.remove('dark-mode');
      }
    };

    loadDarkModeSetting();
  }, []);

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Apply both dark mode classes to document immediately for compatibility
    if (newDarkMode) {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.remove('dark-mode');
    }

    // Save to backend
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await updateUserPreferences({
          dark_mode: newDarkMode,
        });
      } catch (err) {
        console.error('Failed to save dark mode setting:', err);
      }
    }
  };

  return (
    // eslint-disable-next-line react-x/no-unstable-context-value
    <DarkModeContext value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDarkMode = (): DarkModeContextType => {
  const context = use(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
