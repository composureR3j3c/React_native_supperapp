import { Stack } from 'expo-router';

import ScreenContainer from '../components/ScreenContainer';

export default function FinanceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Finance' }} />
      <ScreenContainer
        title="Finance"
        description="Track income, expenses, and budgets."
      />
    </>
  );
}
