import { Ionicons } from '@expo/vector-icons';
import { Stack, Tabs } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import ThemeToggle from '../../components/ThemeToggle';
import WalletMessage from '../../components/WalletMessage';
import useWallet, { WalletProvider } from '../../hooks/useWallet';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

const TAB_ICONS = {
  index: 'wallet',
  activity: 'swap-vertical',
  trends: 'bar-chart',
};

export default function WalletLayout() {
  return (
    <WalletProvider>
      <WalletTabs />
    </WalletProvider>
  );
}

// Balances, In & Out and Trends share one SMS read and one show/hide toggle in the Wallet header.
function WalletTabs() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { status, load, hidden, setHidden } = useWallet();

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
                accessibilityLabel={hidden ? 'Show amounts' : 'Hide amounts'}
              >
                <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.text} />
              </Pressable>
              <ThemeToggle />
            </View>
          ),
        }}
      />
      {status === 'loading' || status === 'idle' ? (
        <View style={styles.screen}>
          <ActivityIndicator color={colors.primary} style={styles.centered} />
        </View>
      ) : status !== 'ready' ? (
        <View style={styles.screen}>
          {status === 'unsupported' ? (
            <WalletMessage text="Reading balances from SMS only works in the Android app build (not Expo Go, iOS or web)." />
          ) : status === 'denied' ? (
            <WalletMessage text="SMS permission is needed to read your balances." action="Try again" onAction={load} />
          ) : status === 'blocked' ? (
            <WalletMessage
              text="SMS permission is turned off. Enable it in Settings > Apps > Driver Assistant > Permissions."
              action="Open Settings"
              onAction={() => Linking.openSettings()}
            />
          ) : (
            <WalletMessage text="Could not read your messages. Please try again." action="Try again" onAction={load} />
          )}
        </View>
      ) : (
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
            tabBarIcon: ({ color, size, focused }) => {
              const name = TAB_ICONS[route.name] ?? 'ellipse';
              return <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;
            },
          })}
        >
          <Tabs.Screen name="index" options={{ title: 'Balances' }} />
          <Tabs.Screen name="activity" options={{ title: 'In & Out' }} />
          <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
        </Tabs>
      )}
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    screen: {
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
  });
