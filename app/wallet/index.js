import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import Section from '../../components/Section';
import WalletMessage from '../../components/WalletMessage';
import useWallet, { LOOKBACK_DAYS } from '../../hooks/useWallet';
import { MASK, formatAmount, totalsByCurrency } from '../../lib/walletFormat';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

// Front page of Wallet: balances only. Tapping an account opens In & Out filtered to it.
export default function BalancesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { accounts, load, hidden, setAccountFilter } = useWallet();
  const mask = (text) => (hidden ? MASK : text);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      {accounts.length === 0 ? (
        <WalletMessage text={`No balance messages found in the last ${LOOKBACK_DAYS} days.`} action="Refresh" onAction={load} />
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Total balance</Text>
            {totalsByCurrency(accounts, 'balance').map(([currency, total]) => (
              <Text key={currency} style={styles.summaryAmount}>
                {mask(formatAmount(total, currency))}
              </Text>
            ))}
            <Text style={styles.summaryNote}>From bank SMS in the last {LOOKBACK_DAYS} days · pull down to refresh</Text>
          </View>

          <Section title="Accounts">
            {accounts.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => {
                  setAccountFilter(item.id);
                  router.navigate('/wallet/activity');
                }}
                accessibilityRole="button"
                accessibilityHint="Shows this account's money in and out"
              >
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
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: 20,
      gap: 20,
    },
    summary: {
      backgroundColor: c.primary,
      borderRadius: 16,
      padding: 20,
      gap: 4,
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
  });
