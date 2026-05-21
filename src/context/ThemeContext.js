import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS } from '../config/theme';

const ThemeContext = createContext(null);
const KEY = 'cd_theme';

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v === 'light') setIsDark(false); })
      .catch(() => {});
  }, []);

  const toggle = () =>
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });

  const value = useMemo(
    () => ({ isDark, colors: isDark ? DARK_COLORS : LIGHT_COLORS, toggle }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
