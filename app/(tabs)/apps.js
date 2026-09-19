import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AppTile from '../../components/AppTile';

const APPS = [
  { key: 'tasks', href: '/tasks', label: 'Tasks', icon: 'checkbox' },
  { key: 'finance', href: '/finance', label: 'Finance', icon: 'wallet' },
  { key: 'habits', href: '/habits', label: 'Habits', icon: 'flame' },
  { key: 'documents', href: '/documents', label: 'Documents', icon: 'document-text' },
  { key: 'location', href: '/location', label: 'Location', icon: 'location' },
  { key: 'profile', href: '/profile', label: 'Profile', icon: 'person' },
];

const COLUMNS = 2;
const GRID_GAP = 16;
const CONTAINER_PADDING = 20;

export default function AppsScreen() {
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTAINER_PADDING,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
