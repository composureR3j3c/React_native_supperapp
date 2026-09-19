import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const TAB_ICONS = {
  index: 'home',
  apps: 'apps',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
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
