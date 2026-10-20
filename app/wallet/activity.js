import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import WalletMessage from '../../components/WalletMessage';
import useWallet, { LOOKBACK_DAYS } from '../../hooks/useWallet';
import { CATEGORIES } from '../../lib/categorizeTransaction';
import { MASK, belongsTo, formatAmount, formatWhen, totalsByCurrency } from '../../lib/walletFormat';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

const DIRECTIONS = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Money in' },
  { key: 'out', label: 'Money out' },
];

// Every money movement found in SMS, with its inferred category. Filter by direction, category and account.
export default function ActivityScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { accounts, transactions, load, hidden, accountFilter, setAccountFilter } = useWallet();
  const [direction, setDirection] = useState('all');
  const [category, setCategory] = useState(null);
  const mask = (text) => (hidden ? MASK : text);

  const account = accounts.find((item) => item.id === accountFilter);
  const forAccount = useMemo(
    () => (account ? transactions.filter(belongsTo(account)) : transactions),
    [transactions, account]
  );

  // Totals ignore the direction filter so money in and out always show side by side.
  const forCategory = useMemo(
    () => (category ? forAccount.filter((tx) => tx.category === category) : forAccount),
    [forAccount, category]
  );
  const visible = direction === 'all' ? forCategory : forCategory.filter((tx) => tx.direction === direction);

  // Category chips list what's present for the current account and direction, most frequent first.
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const tx of forAccount) {
      if (direction !== 'all' && tx.direction !== direction) continue;
      counts[tx.category] = (counts[tx.category] ?? 0) + 1;
    }
    // Keep the selected chip visible even at zero, so it can always be cleared.
    if (category && !counts[category]) counts[category] = 0;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [forAccount, direction, category]);

  const totalsFor = (dir) => totalsByCurrency(forCategory.filter((tx) => tx.direction === dir), 'amount');

  return (
    <FlatList
      style={styles.screen}
      data={visible}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onRefresh={load}
      refreshing={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.totals}>
            {['in', 'out'].map((dir) => (
              <View key={dir} style={styles.totalBox}>
                <Text style={styles.totalLabel}>{dir === 'in' ? 'Money in' : 'Money out'}</Text>
                {(totalsFor(dir).length ? totalsFor(dir) : [['ETB', 0]]).map(([currency, total]) => (
                  <Text key={currency} style={[styles.totalAmount, { color: dir === 'in' ? colors.success : colors.danger }]}>
                    {mask(formatAmount(total, currency))}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          <Text style={styles.note}>Last {LOOKBACK_DAYS} days · categories are guessed from SMS wording</Text>

          <View style={styles.segment}>
            {DIRECTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[styles.segmentItem, direction === option.key && styles.segmentItemOn]}
                onPress={() => setDirection(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: direction === option.key }}
              >
                <Text style={[styles.segmentText, direction === option.key && styles.segmentTextOn]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {account ? (
              <Pressable
                style={[styles.chip, styles.chipOn]}
                onPress={() => setAccountFilter(null)}
                accessibilityLabel="Remove account filter"
              >
                <Text style={[styles.chipText, styles.chipTextOn]}>
                  {account.accountLast4 ? `•••• ${account.accountLast4}` : account.sender}
                </Text>
                <Ionicons name="close" size={14} color={colors.onPrimary} />
              </Pressable>
            ) : null}
            {categoryCounts.map(([key, count]) => {
              const selected = category === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.chip, selected && styles.chipOn]}
                  onPress={() => setCategory(selected ? null : key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={CATEGORIES[key].icon} size={14} color={selected ? colors.onPrimary : colors.textSecondary} />
                  <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                    {CATEGORIES[key].label} · {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<WalletMessage text="No transactions match these filters." />}
      renderItem={({ item }) => {
        const incoming = item.direction === 'in';
        const tint = incoming ? colors.success : colors.danger;
        return (
          <View style={styles.row}>
            <View style={[styles.rowIcon, { borderColor: tint }]}>
              <Ionicons name={CATEGORIES[item.category].icon} size={18} color={tint} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{CATEGORIES[item.category].label}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.sender}
                {item.accountLast4 ? ` •••• ${item.accountLast4}` : ''} · {formatWhen(item.date)}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: incoming ? colors.success : colors.text }]}>
              {mask(`${incoming ? '+' : '−'}${formatAmount(item.amount, item.currency)}`)}
            </Text>
          </View>
        );
      }}
    />
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    list: {
      padding: 20,
      gap: 10,
    },
    header: {
      gap: 14,
      marginBottom: 6,
    },
    totals: {
      flexDirection: 'row',
      gap: 10,
    },
    totalBox: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.surface,
      gap: 2,
    },
    totalLabel: {
      fontSize: 14,
      color: c.textSecondary,
    },
    totalAmount: {
      fontSize: 17,
      fontWeight: '700',
    },
    note: {
      fontSize: 13,
      color: c.textSecondary,
    },
    segment: {
      flexDirection: 'row',
      borderRadius: 10,
      backgroundColor: c.surface,
      padding: 3,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    segmentItemOn: {
      backgroundColor: c.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
    },
    segmentTextOn: {
      color: c.onPrimary,
    },
    chips: {
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      fontSize: 14,
      color: c.text,
    },
    chipTextOn: {
      color: c.onPrimary,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    rowMeta: {
      fontSize: 14,
      color: c.textSecondary,
    },
    rowAmount: {
      fontSize: 15,
      fontWeight: '700',
    },
  });
