import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AppTile from '../../components/AppTile';

const APPS = [
 { key: 'location', href: '/location', label: 'Location', icon: 'location' },
 
  { key: 'quickContacts', href: '/contact', label: 'Quick Contacts', icon: 'people' },
  { key: 'music', href: '/music', label: 'Music', icon: 'musical-notes' },

 { key: 'tasks', href: '/tasks', label: 'Tasks', icon: 'checkbox' },
  
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
