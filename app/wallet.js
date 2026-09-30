import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ThemeToggle from '../components/ThemeToggle';
import { latestBalances } from '../lib/parseBalanceSms';
import { isSmsReaderAvailable, readInbox } from '../modules/sms-reader';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const LOOKBACK_DAYS = 90;
const MAX_MESSAGES = 1000;

function formatAmount(amount, currency) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function totalsByCurrency(accounts) {
  const totals = {};
  for (const account of accounts) {
    totals[account.currency] = (totals[account.currency] ?? 0) + account.balance;
  }
  return Object.entries(totals);
}

export default function WalletScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Balances live in memory only; they are re-read from SMS each time and never saved to storage.
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | denied | blocked | unsupported | error
  const [hidden, setHidden] = useState(false);

  const load = useCallback(async () => {
    if (Platform.OS !== 'android' || !isSmsReaderAvailable) {
      setStatus('unsupported');
      return;
    }
    setStatus('loading');
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
        title: 'Read bank messages',
        message: 'Driver Assistant reads bank SMS on this phone to show your balances. Nothing leaves your device.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setStatus('blocked');
        return;
      }
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        setStatus('denied');
        return;
      }

      const messages = await readInbox({
        sinceMs: Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        limit: MAX_MESSAGES,
      });
      setAccounts(latestBalances(messages));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mask = (text) => (hidden ? '••••••' : text);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Wallet',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setHidden((value) => !value)}
                hitSlop={8}
                accessibilityLabel={hidden ? 'Show balances' : 'Hide balances'}
              >
                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text} />
              </Pressable>
              <ThemeToggle />
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        {status === 'loading' || status === 'idle' ? (
          <ActivityIndicator color={colors.primary} style={styles.centered} />
        ) : status === 'unsupported' ? (
          <Message text="Reading balances from SMS only works in the Android app build (not Expo Go, iOS or web)." />
        ) : status === 'denied' ? (
          <Message text="SMS permission is needed to read your balances." action="Try again" onAction={load} />
        ) : status === 'blocked' ? (
          <Message
            text="SMS permission is turned off. Enable it in Settings > Apps > Driver Assistant > Permissions."
            action="Open Settings"
            onAction={() => Linking.openSettings()}
          />
        ) : status === 'error' ? (
          <Message text="Could not read your messages. Please try again." action="Try again" onAction={load} />
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onRefresh={load}
            refreshing={false}
            ListHeaderComponent={
              accounts.length > 0 ? (
                <View style={styles.summary}>
                  <Text style={styles.summaryLabel}>Total balance</Text>
                  {totalsByCurrency(accounts).map(([currency, total]) => (
                    <Text key={currency} style={styles.summaryAmount}>
                      {mask(formatAmount(total, currency))}
                    </Text>
                  ))}
                  <Text style={styles.summaryNote}>
                    From bank SMS in the last {LOOKBACK_DAYS} days · pull down to refresh
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Message text={`No balance messages found in the last ${LOOKBACK_DAYS} days.`} action="Refresh" onAction={load} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Ionicons name="card-outline" size={20} color={colors.onPrimary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardSender} numberOfLines={1}>
                    {item.sender}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.accountLast4 ? `•••• ${item.accountLast4} · ` : ''}
                    as of {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.cardBalance}>{mask(formatAmount(item.balance, item.currency))}</Text>
              </View>
            )}
          />
        )}
      </View>
    </>
  );
}

function Message({ text, action, onAction }) {
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
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    marginTop: 40,
  },
  list: {
    padding: 20,
    gap: 10,
  },
  summary: {
    backgroundColor: c.primary,
    borderRadius: 16,
    padding: 20,
    gap: 4,
    marginBottom: 6,
  },
  summaryLabel: {
    color: c.onPrimary,
    fontSize: 14,
  },
  summaryAmount: {
    color: c.onPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  summaryNote: {
    color: c.onPrimary,
    fontSize: 14,
    marginTop: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: c.surface,
    borderRadius: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardSender: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  cardMeta: {
    fontSize: 14,
    color: c.textSecondary,
  },
  cardBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
  },
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
