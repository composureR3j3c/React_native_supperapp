import { StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export default function LocationPickerMap({ style }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.text}>
        Picking a location on the map isn't available on web — use the mobile app.
      </Text>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  wrap: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: c.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
