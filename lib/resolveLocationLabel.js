import * as Location from 'expo-location';

export async function resolveLocationLabel(latitude, longitude, customName) {
  const trimmed = customName?.trim();
  if (trimmed) return trimmed;

  const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      return [place.name, place.city, place.region].filter(Boolean).join(', ') || fallback;
    }
  } catch {
    // Reverse geocoding isn't supported on every platform (e.g. web) — fall back to coordinates.
  }
  return fallback;
}
