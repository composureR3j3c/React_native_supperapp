import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { darkColors, lightColors } from './colors';

const STORAGE_KEY = 'driverassistant.themeMode';
const MODES = ['auto', 'light', 'dark'];
// "auto" switches to dark between these hours (local time).
const NIGHT_START_HOUR = 18;
const NIGHT_END_HOUR = 6;
const CLOCK_CHECK_MS = 60 * 1000;

function isNight(date = new Date()) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('auto');
  const [night, setNight] = useState(isNight);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (MODES.includes(saved)) setModeState(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'auto') return undefined;
    setNight(isNight());
    const timer = setInterval(() => setNight(isNight()), CLOCK_CHECK_MS);
    return () => clearInterval(timer);
  }, [mode]);

  const scheme = mode === 'auto' ? (night ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  // Keep native UI (alerts, keyboard, root background) in step with the app's own theme.
  useEffect(() => {
    Appearance.setColorScheme(scheme);
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [scheme, colors.background]);

  const setMode = useCallback((next) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const cycleMode = useCallback(() => {
    setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  }, [mode, setMode]);

  const value = useMemo(
    () => ({ mode, scheme, colors, setMode, cycleMode }),
    [mode, scheme, colors, setMode, cycleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

// Builds a StyleSheet from the current colors: `const styles = useThemedStyles(makeStyles);`
export function useThemedStyles(makeStyles) {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [makeStyles, colors]);
}
