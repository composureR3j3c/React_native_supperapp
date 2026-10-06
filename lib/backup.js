import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Only this app's own storage keys are backed up or restored. Wallet balances are never stored, so never exported.
const KEY_PREFIXES = ['lifeos.', 'driverassistant.'];
const FORMAT = 'driver-assistant-backup';
const VERSION = 1;

const isAppKey = (key) => KEY_PREFIXES.some((prefix) => key.startsWith(prefix));

async function appKeys() {
  return (await AsyncStorage.getAllKeys()).filter(isAppKey);
}

// Writes a JSON backup to the cache folder and opens the share sheet so it can be saved to Drive, Files, email, etc.
export async function exportBackup() {
  const pairs = await AsyncStorage.multiGet(await appKeys());
  const data = Object.fromEntries(pairs.filter(([, value]) => value != null));
  const payload = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data };

  const date = payload.exportedAt.slice(0, 10);
  const file = new File(Paths.cache, `driver-assistant-backup-${date}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your backup',
  });
}

// Lets the user pick a backup file. Resolves to the validated backup, or null if they cancel.
export async function pickBackup() {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'application/octet-stream', 'text/*'] });
  if (picked.canceled) return null;

  let payload;
  try {
    payload = JSON.parse(await picked.result.text());
  } catch {
    throw new Error('That file is not a Driver Assistant backup.');
  }
  if (payload?.format !== FORMAT || typeof payload.data !== 'object' || payload.data === null) {
    throw new Error('That file is not a Driver Assistant backup.');
  }
  if (payload.version > VERSION) {
    throw new Error('This backup was made by a newer version of the app. Update the app first.');
  }
  return payload;
}

// Replaces this app's saved data with the backup's. Keys that don't belong to the app are ignored.
export async function restoreBackup(payload) {
  const entries = Object.entries(payload.data).filter(
    ([key, value]) => isAppKey(key) && typeof value === 'string'
  );
  // Never wipe current data for a backup with nothing usable in it.
  if (entries.length === 0) throw new Error('That backup has no data to restore.');
  const restoredKeys = new Set(entries.map(([key]) => key));
  const staleKeys = (await appKeys()).filter((key) => !restoredKeys.has(key));

  await AsyncStorage.multiSet(entries);
  if (staleKeys.length > 0) await AsyncStorage.multiRemove(staleKeys);
  return entries.length;
}
