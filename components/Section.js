import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../theme/ThemeProvider';

// Small uppercase heading with an optional link on the right, used to group content on a screen.
export default function Section({ title, actionLabel, onAction, children }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel ? (
          <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    section: {
      gap: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    action: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
  });
