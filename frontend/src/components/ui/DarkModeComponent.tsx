import React, { createContext, use, useState, useEffect } from 'react';

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

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) {
      setIsDarkMode(stored === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
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
