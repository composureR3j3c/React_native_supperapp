import { Stack } from 'expo-router';

import ScreenContainer from '../components/ScreenContainer';

export default function DocumentsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Documents' }} />
      <ScreenContainer
        title="Documents"
        description="Capture and store your important documents."
      />
    </>
  );
}
