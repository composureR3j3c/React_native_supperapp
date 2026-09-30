import { Linking, Platform } from 'react-native';

// Opens the Spotify app via its URI scheme; falls back to the web player if the app isn't installed.
export async function openSpotify(query) {
  const encoded = encodeURIComponent(query ?? '');
  const appUrl = query ? `spotify:search:${encoded}` : 'spotify://';
  const webUrl = query ? `https://open.spotify.com/search/${encoded}` : 'https://open.spotify.com';

  // Browsers don't report a missing handler, so web always uses the web player.
  if (Platform.OS === 'web') {
    Linking.openURL(webUrl);
    return;
  }

  try {
    await Linking.openURL(appUrl);
  } catch {
    Linking.openURL(webUrl);
  }
}

export function openYouTube(query) {
  const url = query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    : 'https://www.youtube.com';
  Linking.openURL(url);
}

export function openInMaps(latitude, longitude, label) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });
  Linking.openURL(url);
}

export function callNumber(phone) {
  if (phone) Linking.openURL(`tel:${phone}`);
}
