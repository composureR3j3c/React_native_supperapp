import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { requestPinWidget } from 'react-native-android-widget';

import AppTile from '../../components/AppTile';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

const APPS = [
 { key: 'location', href: '/location', label: 'Location', icon: 'location' },
 
  { key: 'quickContacts', href: '/contact', label: 'Quick Contacts', icon: 'people' },
  { key: 'music', href: '/music', label: 'Music', icon: 'musical-notes' },
  { key: 'wallet', href: '/wallet', label: 'Wallet', icon: 'wallet' },

 { key: 'tasks', href: '/tasks', label: 'Tasks', icon: 'checkbox' },
  
   { key: 'profile', href: '/profile', label: 'Profile', icon: 'person' },
];

const COLUMNS = 2;
const GRID_GAP = 16;
const CONTAINER_PADDING = 20;

async function addLauncherToHomeScreen() {
  const supported = await requestPinWidget({ widgetName: 'Launcher' }).catch(() => false);
  if (!supported) {
    Alert.alert(
      'Add it manually',
      'Long-press your home screen, tap Widgets, then drag the widget onto the home screen.'
    );
  }
}

export default function AppsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const tileSize = (width - CONTAINER_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apps</Text>
      <View style={[styles.grid, { gap: GRID_GAP }]}>
        {APPS.map((app) => (
          <AppTile key={app.key} href={app.href} label={app.label} icon={app.icon} size={tileSize} />
        ))}
      </View>
      {Platform.OS === 'android' && (
        <Pressable style={styles.pinButton} onPress={addLauncherToHomeScreen}>
          <Ionicons name="add-circle-outline" size={20} color={colors.onNeutralButton} />
          <Text style={styles.pinButtonText}>Add button to home screen</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTAINER_PADDING,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: c.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: c.neutralButton,
  },
  pinButtonText: {
    color: c.onNeutralButton,
    fontSize: 16,
    fontWeight: '600',
  },
});
