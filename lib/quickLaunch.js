import { PermissionsAndroid, Platform } from 'react-native';

import { isQuickLaunchAvailable, isQuickLaunchEnabled, startQuickLaunch, stopQuickLaunch } from '../modules/quick-launch';

const NOTIFICATION = { title: 'Driver Assistant', text: 'Tap to open', color: '#1f5963' };

async function hasNotificationPermission() {
  // Android 13 (API 33) added a runtime permission for notifications; older versions allow them by default.
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

// Called on app start: on by default the first time, and restarted if the system stopped it.
export async function restoreQuickLaunch() {
  if (!isQuickLaunchAvailable || isQuickLaunchEnabled() === false) return;
  if (await hasNotificationPermission()) startQuickLaunch(NOTIFICATION);
}

// Returns the resulting state: false if the user turned it on but denied notification permission.
export async function setQuickLaunchEnabled(enabled) {
  if (!isQuickLaunchAvailable) return false;
  if (!enabled) {
    stopQuickLaunch();
    return false;
  }
  if (!(await hasNotificationPermission())) return false;
  startQuickLaunch(NOTIFICATION);
  return true;
}

export { isQuickLaunchAvailable, isQuickLaunchEnabled };
