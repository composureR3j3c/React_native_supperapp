import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../theme/ThemeProvider';

const TAB_ICONS = {
  index: 'home',
  apps: 'apps',
};

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // High-contrast tints (7:1+ against the tab bar in both themes) so tabs are readable at a glance.
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        headerRight: () => <ThemeToggle />,
        tabBarIcon: ({ color, size, focused }) => {
          const name = TAB_ICONS[route.name] ?? 'ellipse';
          return (
            <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps' }} />
    </Tabs>
  );
}
