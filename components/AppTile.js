import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export default function AppTile({ href, label, icon, size }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Link href={href} asChild>
      <Pressable>
        {({ pressed }) => (
          <View style={[styles.tile, { width: size, height: size }, pressed && styles.tilePressed]}>
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={26} color={colors.onNeutralButton} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: c.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tilePressed: {
    backgroundColor: c.surface,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.neutralButton,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
});
