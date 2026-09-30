import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import LocationPickerMap from '../components/LocationPickerMap';
import useLocations from '../hooks/useLocations';
import { resolveLocationLabel } from '../lib/resolveLocationLabel';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const DEFAULT_REGION = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 80,
  longitudeDelta: 80,
};

export default function PickLocationScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { name } = useLocalSearchParams();
  const { addLocation } = useLocations();
  const [initialRegion, setInitialRegion] = useState(DEFAULT_REGION);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          setInitialRegion({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch {
        // Keep the default wide-zoom region if this fails for any reason.
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!pickedCoords) return;
    setError(null);
    setSaving(true);
    try {
      const label = await resolveLocationLabel(pickedCoords.latitude, pickedCoords.longitude, name);
      addLocation({
        id: Date.now().toString(),
        label,
        latitude: pickedCoords.latitude,
        longitude: pickedCoords.longitude,
        savedAt: Date.now(),
      });
      router.back();
    } catch {
      setError('Could not save this location. Please try again.');
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Pick a Location' }} />
      <View style={styles.container}>
        <LocationPickerMap
          style={styles.map}
          initialRegion={initialRegion}
          pickedCoords={pickedCoords}
          onPick={setPickedCoords}
        />

        <View style={styles.footer}>
          <Text style={styles.hint}>
            {pickedCoords
              ? 'Pin dropped — tap below to save it.'
              : 'Tap anywhere on the map to drop a pin.'}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.saveButton, !pickedCoords && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !pickedCoords}
          >
            {saving ? (
              <ActivityIndicator color={colors.onNeutralButton} />
            ) : (
              <>
                <Ionicons name="pin" size={18} color={colors.onNeutralButton} />
                <Text style={styles.saveButtonText}>Save pinned location</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 20,
    gap: 10,
  },
  hint: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.neutralButton,
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: c.onNeutralButton,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: c.danger,
    fontSize: 14,
    textAlign: 'center',
  },
});
