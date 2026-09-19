import { Stack } from 'expo-router';

import ScreenContainer from '../components/ScreenContainer';

export default function HabitsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Habits' }} />
      <ScreenContainer
        title="Habits"
        description="Build daily habits and keep your streaks alive."
      />
    </>
  );
}
