import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import useLocations from '../hooks/useLocations';
import { resolveLocationLabel } from '../lib/resolveLocationLabel';

const LOCATION_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, timeoutError) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(timeoutError), ms)),
  ]);
}

function openInMaps(latitude, longitude, label) {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });
  Linking.openURL(url);
}

export default function LocationScreen() {
  const { locations, loaded, addLocation, deleteLocation, reload } = useLocations();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Picking a location happens on a separate page — refresh the list when we come back to it.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleSaveCurrentLocation = async () => {
    setError(null);
    setSaving(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location permission denied. Enable it in Settings to save places.');
        return;
      }

      const position = await withTimeout(
        Location.getCurrentPositionAsync({}),
        LOCATION_TIMEOUT_MS,
        new Error('timeout')
      );
      const { latitude, longitude } = position.coords;
      const label = await resolveLocationLabel(latitude, longitude, name);

      addLocation({
        id: Date.now().toString(),
        label,
        latitude,
        longitude,
        savedAt: Date.now(),
      });
      setName('');
    } catch (err) {
      setError(
        err?.message === 'timeout'
          ? 'Could not get a location fix in time. Try moving outdoors and try again.'
          : 'Could not get your current location. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFromMap = () => {
    router.push({ pathname: '/pick-location', params: { name } });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Location' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Location</Text>
        <Text style={styles.description}>Saved places and location-based reminders.</Text>

        <TextInput
          style={styles.input}
          placeholder="Name (e.g. Home, Work)"
          value={name}
          onChangeText={setName}
          editable={!saving}
        />

        <Pressable style={styles.saveButton} onPress={handleSaveCurrentLocation} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="locate" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save current location</Text>
            </>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loaded && locations.length === 0 ? (
          <Text style={styles.empty}>No places saved yet.</Text>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Ionicons name="location" size={20} color="#333" />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.rowCoords}>
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => openInMaps(item.latitude, item.longitude, item.label)}
                  hitSlop={8}
                  accessibilityLabel="Open in Maps"
                >
                  <MaterialCommunityIcons name="google-maps" size={22} color="#2e7d32" />
                </Pressable>
                <Pressable onPress={() => deleteLocation(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#c62828" />
                </Pressable>
              </View>
            )}
          />
        )}

        <Pressable style={styles.mapButton} onPress={handleSelectFromMap}>
          <MaterialCommunityIcons name="google-maps" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>Select from map</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#c62828',
    fontSize: 13,
  },
  empty: {
    color: '#888',
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    color: '#222',
  },
  rowCoords: {
    fontSize: 12,
    color: '#999',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
