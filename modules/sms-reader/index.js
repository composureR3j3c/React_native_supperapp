import { requireOptionalNativeModule } from 'expo';

// Null on iOS, web, and Expo Go, where there is no SMS inbox access.
const SmsReader = requireOptionalNativeModule('SmsReader');

export const isSmsReaderAvailable = SmsReader != null;

export function readInbox({ sinceMs, limit }) {
  if (!SmsReader) return Promise.resolve([]);
  return SmsReader.readInbox(sinceMs, limit);
}
