import { Stack } from 'expo-router';

import ScreenContainer from '../components/ScreenContainer';


export default function MusicScreen() {
  return (
    <>
     <Stack.Screen options={{ title: 'Music' }} />
      <ScreenContainer
        title="Music"
        description="Listen to your favorite songs and artists."
      />
    </>
    
  );
}
