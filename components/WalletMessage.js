import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '../theme/ThemeProvider';

export default function WalletMessage({ text, action, onAction }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.message}>
      <Text style={styles.messageText}>{text}</Text>
      {action ? (
        <Pressable style={styles.messageButton} onPress={onAction}>
          <Text style={styles.messageButtonText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    message: {
      padding: 20,
      gap: 12,
      alignItems: 'center',
    },
    messageText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
    messageButton: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    messageButtonText: {
      color: c.onPrimary,
      fontWeight: '600',
    },
  });
