import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import { darkColors, lightColors } from './colors';

const STORAGE_KEY = 'driverassistant.themeMode';
const NIGHT_HOURS_KEY = 'driverassistant.nightHours';
export const MODES = ['auto', 'light', 'dark'];
// Default hours (local time) when "auto" switches to dark and back; changeable in Settings.
export const DEFAULT_NIGHT_HOURS = { start: 18, end: 6 };
const CLOCK_CHECK_MS = 60 * 1000;

function isNight({ start, end }, date = new Date()) {
  const hour = date.getHours();
  // A range like 18 -> 6 wraps past midnight; 1 -> 5 does not.
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('auto');
  const [nightHours, setNightHoursState] = useState(DEFAULT_NIGHT_HOURS);
  const [night, setNight] = useState(() => isNight(DEFAULT_NIGHT_HOURS));

  // Exposed so a restored backup can apply its theme settings without restarting the app.
  const reloadSettings = useCallback(() => {
    return AsyncStorage.multiGet([STORAGE_KEY, NIGHT_HOURS_KEY])
      .then(([[, savedMode], [, savedHours]]) => {
        setModeState(MODES.includes(savedMode) ? savedMode : 'auto');
        const hours = savedHours ? JSON.parse(savedHours) : null;
        setNightHoursState(
          Number.isInteger(hours?.start) && Number.isInteger(hours?.end) ? hours : DEFAULT_NIGHT_HOURS
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  useEffect(() => {
    if (mode !== 'auto') return undefined;
    setNight(isNight(nightHours));
    const timer = setInterval(() => setNight(isNight(nightHours)), CLOCK_CHECK_MS);
    return () => clearInterval(timer);
  }, [mode, nightHours]);

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

  const setNightHours = useCallback((hours) => {
    setNightHoursState(hours);
    AsyncStorage.setItem(NIGHT_HOURS_KEY, JSON.stringify(hours)).catch(() => {});
  }, []);

  const cycleMode = useCallback(() => {
    setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  }, [mode, setMode]);

  const value = useMemo(
    () => ({ mode, scheme, colors, setMode, cycleMode, nightHours, setNightHours, reloadSettings }),
    [mode, scheme, colors, setMode, cycleMode, nightHours, setNightHours, reloadSettings]
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
