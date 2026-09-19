import { Stack } from 'expo-router';

import ScreenContainer from '../components/ScreenContainer';

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScreenContainer
        title="Profile"
        description="Settings, security, and preferences."
      />
    </>
  );
}
