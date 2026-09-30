import { StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export default function ScreenContainer({ title, description, children }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: c.text,
  },
  description: {
    fontSize: 15,
    color: c.textSecondary,
  },
});
