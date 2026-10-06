import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import Section from '../components/Section';
import { exportBackup, pickBackup, restoreBackup } from '../lib/backup';
import { isQuickLaunchAvailable, isQuickLaunchEnabled, setQuickLaunchEnabled } from '../lib/quickLaunch';
import { MODES, useTheme, useThemedStyles } from '../theme/ThemeProvider';

const MODE_OPTIONS = {
  auto: { label: 'Auto', icon: 'contrast-outline' },
  light: { label: 'Light', icon: 'sunny' },
  dark: { label: 'Dark', icon: 'moon' },
};

function formatHour(hour) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${suffix}`;
}

function HourStepper({ label, hour, otherHour, onChange }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Skip the other boundary's hour: start === end would mean "never dark".
  const step = (delta) => {
    let next = (hour + delta + 24) % 24;
    if (next === otherHour) next = (next + delta + 24) % 24;
    onChange(next);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepButton} onPress={() => step(-1)} accessibilityLabel={`${label} one hour earlier`}>
          <Ionicons name="remove" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.stepValue}>{formatHour(hour)}</Text>
        <Pressable style={styles.stepButton} onPress={() => step(1)} accessibilityLabel={`${label} one hour later`}>
          <Ionicons name="add" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, mode, setMode, nightHours, setNightHours, reloadSettings } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [quickLaunchOn, setQuickLaunchOn] = useState(false);
  const [busy, setBusy] = useState(null); // 'export' | 'restore' | null

  // Re-read on focus: app start may have just switched it on for the first time.
  useFocusEffect(
    useCallback(() => {
      setQuickLaunchOn(isQuickLaunchEnabled() === true);
    }, [])
  );

  const toggleQuickLaunch = async (enabled) => {
    const result = await setQuickLaunchEnabled(enabled);
    setQuickLaunchOn(result);
    if (enabled && !result) {
      Alert.alert(
        'Notifications are off',
        'Allow notifications for Driver Assistant in Settings to use the quick-launch notification.'
      );
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      await exportBackup();
    } catch (error) {
      Alert.alert('Backup failed', error?.message ?? 'Could not create the backup file.');
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setBusy('restore');
    try {
      const backup = await pickBackup();
      if (!backup) return;
      const savedOn = new Date(backup.exportedAt).toLocaleString();
      Alert.alert(
        'Replace your data?',
        `This replaces your current tasks, places, favorites and settings with the backup from ${savedOn}. This can't be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreBackup(backup);
                await reloadSettings();
                Alert.alert('Restored', 'Your data has been restored.');
              } catch {
                Alert.alert('Restore failed', 'Your data was not changed.');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Restore failed', error?.message ?? 'Could not read that file.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Section title="Appearance">
          <View style={styles.segmented} accessibilityRole="radiogroup">
            {MODES.map((option) => {
              const selected = option === mode;
              return (
                <Pressable
                  key={option}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  onPress={() => setMode(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={MODE_OPTIONS[option].icon}
                    size={20}
                    color={selected ? colors.onPrimary : colors.text}
                  />
                  <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                    {MODE_OPTIONS[option].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Night hours">
          <View style={styles.card}>
            <HourStepper
              label="Dark from"
              hour={nightHours.start}
              otherHour={nightHours.end}
              onChange={(start) => setNightHours({ ...nightHours, start })}
            />
            <View style={styles.divider} />
            <HourStepper
              label="Light from"
              hour={nightHours.end}
              otherHour={nightHours.start}
              onChange={(end) => setNightHours({ ...nightHours, end })}
            />
          </View>
          <Text style={styles.note}>
            {mode === 'auto'
              ? 'Auto mode uses these hours to switch between light and dark.'
              : 'Only used in Auto mode.'}
          </Text>
        </Section>

        {isQuickLaunchAvailable ? (
          <Section title="Quick launch">
            <View style={[styles.card, styles.row]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Quick-launch notification</Text>
                <Text style={styles.note}>Keeps a notification pinned so you can open the app from anywhere.</Text>
              </View>
              <Switch
                value={quickLaunchOn}
                onValueChange={toggleQuickLaunch}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
                accessibilityLabel="Quick-launch notification"
              />
            </View>
          </Section>
        ) : null}

        <Section title="Backup">
          <Text style={styles.note}>
            Saves your tasks, places, favorite contacts and settings to a file you can keep in Drive, Files or email.
            Keep it private: it includes your saved places. Wallet balances are never included.
          </Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.button} onPress={handleExport} disabled={busy !== null}>
              {busy === 'export' ? (
                <ActivityIndicator color={colors.onNeutralButton} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.onNeutralButton} />
                  <Text style={styles.buttonText}>Back up</Text>
                </>
              )}
            </Pressable>
            <Pressable style={styles.button} onPress={handleRestore} disabled={busy !== null}>
              {busy === 'restore' ? (
                <ActivityIndicator color={colors.onNeutralButton} />
              ) : (
                <>
                  <Ionicons name="cloud-download-outline" size={20} color={colors.onNeutralButton} />
                  <Text style={styles.buttonText}>Restore</Text>
                </>
              )}
            </Pressable>
          </View>
          <Text style={styles.note}>
            Favorite contacts are matched by the phone's own contact IDs, so they may not carry over to a new phone.
          </Text>
        </Section>

        <Text style={styles.version}>Driver Assistant {Constants.expoConfig?.version ?? ''}</Text>
      </ScrollView>
    </>
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
      gap: 24,
    },
    segmented: {
      flexDirection: 'row',
      gap: 8,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    segmentSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    segmentLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    segmentLabelSelected: {
      color: c.onPrimary,
    },
    card: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    divider: {
      height: 1,
      backgroundColor: c.surfaceActive,
      marginVertical: 10,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepValue: {
      minWidth: 84,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    note: {
      fontSize: 14,
      color: c.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: c.neutralButton,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.onNeutralButton,
    },
    version: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
  });
