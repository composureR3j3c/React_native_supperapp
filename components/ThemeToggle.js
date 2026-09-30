import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

const MODE_DISPLAY = {
  auto: { icon: 'contrast-outline', label: 'Auto', next: 'light' },
  light: { icon: 'sunny', label: 'Light', next: 'dark' },
  dark: { icon: 'moon', label: 'Dark', next: 'auto (dark at night)' },
};

// Header button that cycles the theme: Auto → Light → Dark.
export default function ThemeToggle() {
  const { mode, colors, cycleMode } = useTheme();
  const display = MODE_DISPLAY[mode];

  return (
    <Pressable
      onPress={cycleMode}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Theme: ${display.label}. Tap to switch to ${display.next}.`}
      style={[styles.button, { borderColor: colors.border }]}
    >
      <Ionicons name={display.icon} size={18} color={colors.text} />
      <Text style={[styles.label, { color: colors.text }]}>{display.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
