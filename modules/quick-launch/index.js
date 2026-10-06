import { requireOptionalNativeModule } from 'expo';

// Null on iOS, web, and Expo Go.
const QuickLaunch = requireOptionalNativeModule('QuickLaunch');

export const isQuickLaunchAvailable = QuickLaunch != null;

// true / false once the user has chosen, null if never set.
export function isQuickLaunchEnabled() {
  return QuickLaunch ? QuickLaunch.isEnabled() : false;
}

export function startQuickLaunch({ title, text, color }) {
  QuickLaunch?.start(title, text, color);
}

export function stopQuickLaunch() {
  QuickLaunch?.stop();
}
