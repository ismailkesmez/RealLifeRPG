import React, { createContext, useContext, useState } from 'react';

export const AppContext = createContext({
  language: 'tr',
  theme: 'dark',
  setLanguage: () => {},
  setTheme: () => {},
});

export function AppProvider({ children, initialLanguage = 'tr', initialTheme = 'dark' }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [theme, setTheme]       = useState(initialTheme);

  return (
    <AppContext.Provider value={{ language, theme, setLanguage, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
