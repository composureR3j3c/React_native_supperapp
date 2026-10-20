import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import Section from '../../components/Section';
import WalletMessage from '../../components/WalletMessage';
import useWallet, { LOOKBACK_DAYS } from '../../hooks/useWallet';
import { CATEGORIES } from '../../lib/categorizeTransaction';
import { MASK, formatAmount, formatCompact } from '../../lib/walletFormat';
import { buildPeriods, mainCurrency, percentChange } from '../../lib/walletPeriods';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

const UNITS = [
  { key: 'week', label: 'Weekly', count: 8 },
  { key: 'month', label: 'Monthly', count: 6 },
];
const CHART_HEIGHT = 150;

// Compares money in and out across recent weeks or months. Tap a bar to compare that period with the one before.
export default function TrendsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { transactions, load, hidden } = useWallet();
  const [unit, setUnit] = useState('month');
  const [selectedKey, setSelectedKey] = useState(null);
  const [breakdown, setBreakdown] = useState('out');
  const mask = (text) => (hidden ? MASK : text);

  const currency = useMemo(() => mainCurrency(transactions), [transactions]);
  const periods = useMemo(
    () => buildPeriods(transactions, { unit, count: UNITS.find((u) => u.key === unit).count, currency }),
    [transactions, unit, currency]
  );

  // Defaults to the current period.
  const selected = periods.find((p) => p.key === selectedKey) ?? periods[periods.length - 1];
  const previous = periods[periods.indexOf(selected) - 1] ?? null;
  const max = Math.max(1, ...periods.flatMap((p) => [p.in, p.out]));
  const name = (period) => (unit === 'week' ? `Week of ${period.label}` : period.label);

  const categories = Object.entries(selected.categories)
    .map(([key, totals]) => ({ key, amount: totals[breakdown], before: previous?.categories[key]?.[breakdown] ?? 0 }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const topCategory = categories[0]?.amount ?? 1;

  const changeBadge = (current, before, upIsGood) => {
    if (!previous) return null;
    const change = percentChange(current, before);
    if (change === null) return current > 0 ? <Text style={styles.changeNeutral}>new</Text> : null;
    if (Math.abs(change) < 0.5) return <Text style={styles.changeNeutral}>no change</Text>;
    const good = change > 0 === upIsGood;
    return (
      <Text style={[styles.change, { color: good ? colors.success : colors.danger }]}>
        {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(0)}%
      </Text>
    );
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.screen}>
        <WalletMessage text={`No transactions found in the last ${LOOKBACK_DAYS} days.`} action="Refresh" onAction={load} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <View style={styles.segment}>
        {UNITS.map((option) => (
          <Pressable
            key={option.key}
            style={[styles.segmentItem, unit === option.key && styles.segmentItemOn]}
            onPress={() => {
              setUnit(option.key);
              setSelectedKey(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: unit === option.key }}
          >
            <Text style={[styles.segmentText, unit === option.key && styles.segmentTextOn]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {name(selected)}
          {previous ? ` vs ${name(previous)}` : ''}
        </Text>
        {[
          ['Money in', selected.in, previous?.in, true],
          ['Money out', selected.out, previous?.out, false],
          ['Net', selected.in - selected.out, previous ? previous.in - previous.out : 0, true],
        ].map(([label, value, before, upIsGood]) => (
          <View key={label} style={styles.compareRow}>
            <Text style={styles.compareLabel}>{label}</Text>
            <Text style={styles.compareValue}>
              {mask(`${value < 0 ? '−' : ''}${formatAmount(Math.abs(value), currency)}`)}
            </Text>
            <View style={styles.changeSlot}>{changeBadge(value, before, upIsGood)}</View>
          </View>
        ))}
      </View>

      <Section title={`In vs out · ${currency}`}>
        <View style={styles.chartCard}>
          <Text style={styles.axisLabel}>{mask(formatCompact(max))}</Text>
          <View style={styles.chart}>
            {periods.map((period) => {
              const isSelected = period === selected;
              return (
                <Pressable
                  key={period.key}
                  style={[styles.barGroup, isSelected && styles.barGroupSelected]}
                  onPress={() => setSelectedKey(period.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${name(period)}${hidden ? '' : `, in ${formatAmount(period.in, currency)}, out ${formatAmount(period.out, currency)}`}`}
                >
                  <View style={styles.bars}>
                    <View style={[styles.bar, { height: (period.in / max) * CHART_HEIGHT, backgroundColor: colors.success }]} />
                    <View style={[styles.bar, { height: (period.out / max) * CHART_HEIGHT, backgroundColor: colors.danger }]} />
                  </View>
                  <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]} numberOfLines={1}>
                    {period.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={[styles.swatch, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Money in</Text>
            <View style={[styles.swatch, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Money out</Text>
          </View>
        </View>
      </Section>

      <Section title={`Categories · ${name(selected)}`}>
        <View style={styles.segment}>
          {[
            ['out', 'Spending'],
            ['in', 'Income'],
          ].map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.segmentItem, breakdown === key && styles.segmentItemOn]}
              onPress={() => setBreakdown(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: breakdown === key }}
            >
              <Text style={[styles.segmentText, breakdown === key && styles.segmentTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {categories.length === 0 ? (
          <Text style={styles.empty}>Nothing {breakdown === 'out' ? 'spent' : 'received'} in this period.</Text>
        ) : (
          categories.map((row) => (
            <View key={row.key} style={styles.categoryRow}>
              <Ionicons name={CATEGORIES[row.key].icon} size={18} color={colors.textSecondary} />
              <View style={styles.categoryMain}>
                <View style={styles.categoryLine}>
                  <Text style={styles.categoryLabel}>{CATEGORIES[row.key].label}</Text>
                  <Text style={styles.categoryAmount}>{mask(formatAmount(row.amount, currency))}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${(row.amount / topCategory) * 100}%`,
                        backgroundColor: breakdown === 'out' ? colors.danger : colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.changeSlot}>{changeBadge(row.amount, row.before, breakdown === 'in')}</View>
            </View>
          ))
        )}
      </Section>

      <Text style={styles.note}>
        {currency} only · from bank SMS in the last {LOOKBACK_DAYS} days · categories are guessed from SMS wording
      </Text>
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
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surface,
      gap: 10,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    compareLabel: {
      flex: 1,
      fontSize: 14,
      color: c.textSecondary,
    },
    compareValue: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    changeSlot: {
      width: 72,
      alignItems: 'flex-end',
    },
    change: {
      fontSize: 13,
      fontWeight: '700',
    },
    changeNeutral: {
      fontSize: 13,
      color: c.textSecondary,
    },
    chartCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.surface,
      gap: 6,
    },
    axisLabel: {
      fontSize: 12,
      color: c.textSecondary,
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    barGroup: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 6,
      borderRadius: 8,
    },
    barGroupSelected: {
      backgroundColor: c.surfaceActive,
    },
    bars: {
      height: CHART_HEIGHT,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
    },
    bar: {
      width: 10,
      minHeight: 1,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    barLabel: {
      fontSize: 12,
      color: c.textSecondary,
      paddingVertical: 6,
    },
    barLabelSelected: {
      color: c.text,
      fontWeight: '700',
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    swatch: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 13,
      color: c.textSecondary,
      marginRight: 10,
    },
    empty: {
      fontSize: 14,
      color: c.textSecondary,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryMain: {
      flex: 1,
      gap: 4,
    },
    categoryLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryLabel: {
      fontSize: 14,
      color: c.text,
    },
    categoryAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 3,
    },
    note: {
      fontSize: 13,
      color: c.textSecondary,
    },
  });
