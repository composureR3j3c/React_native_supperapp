import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import useLocations from '../hooks/useLocations';
import { openInMaps } from '../lib/openApps';
import { encodePlusCode } from '../lib/plusCode';
import { resolveLocationLabel } from '../lib/resolveLocationLabel';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const LOCATION_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, timeoutError) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(timeoutError), ms)),
  ]);
}

function LocationRow({ item, onRename, onDelete, onOpen }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);

  const startEditing = () => {
    setDraft(item.label);
    setEditing(true);
  };

  const saveName = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.label) onRename(trimmed);
    setEditing(false);
  };

  return (
    <View style={styles.row}>
      <Ionicons name="location" size={20} color={colors.textSecondary} />
      <View style={styles.rowText}>
        {editing ? (
          <TextInput
            placeholderTextColor={colors.placeholder}
            style={styles.nameInput}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={saveName}
            returnKeyType="done"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Text style={styles.rowLabel} numberOfLines={2}>
            {item.label}
          </Text>
        )}
        <Text style={styles.rowPlusCode} selectable>
          Plus Code: {encodePlusCode(item.latitude, item.longitude)}
        </Text>
        <Text style={styles.rowCoords} selectable>
          Lat {item.latitude.toFixed(5)}, Lng {item.longitude.toFixed(5)}
        </Text>
      </View>

      {editing ? (
        <>
          <Pressable onPress={saveName} hitSlop={8} accessibilityLabel="Save name">
            <Ionicons name="checkmark" size={22} color={colors.success} />
          </Pressable>
          <Pressable onPress={() => setEditing(false)} hitSlop={8} accessibilityLabel="Cancel editing">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </>
      ) : (
        <>
          <Pressable onPress={startEditing} hitSlop={8} accessibilityLabel="Edit name">
            <Ionicons name="pencil" size={19} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            accessibilityLabel="Open in Maps"
          >
            <MaterialCommunityIcons name="google-maps" size={22} color={colors.success} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Delete location">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function LocationScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { locations, loaded, addLocation, deleteLocation, updateLocation, markLocationUsed, reload } = useLocations();
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
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          placeholder="Name (e.g. Home, Work)"
          value={name}
          onChangeText={setName}
          editable={!saving}
        />

        <Pressable style={styles.saveButton} onPress={handleSaveCurrentLocation} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.onNeutralButton} />
          ) : (
            <>
              <Ionicons name="locate" size={18} color={colors.onNeutralButton} />
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
              <LocationRow
                item={item}
                onRename={(label) => updateLocation(item.id, { label })}
                onDelete={() => deleteLocation(item.id)}
                onOpen={() => {
                  markLocationUsed(item.id);
                  openInMaps(item.latitude, item.longitude, item.label);
                }}
              />
            )}
          />
        )}

        <Pressable style={styles.mapButton} onPress={handleSelectFromMap}>
          <MaterialCommunityIcons name="google-maps" size={20} color={colors.onPrimary} />
          <Text style={styles.mapButtonText}>Select from map</Text>
        </Pressable>
      </View>
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: c.text,
  },
  description: {
    fontSize: 15,
    color: c.textSecondary,
  },
  input: {
    color: c.text,
    borderWidth: 1,
    borderColor: c.border,
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
    backgroundColor: c.neutralButton,
    borderRadius: 10,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: c.onNeutralButton,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: c.danger,
    fontSize: 14,
  },
  empty: {
    color: c.textSecondary,
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
    backgroundColor: c.surface,
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  nameInput: {
    fontSize: 15,
    color: c.text,
    borderBottomWidth: 1,
    borderBottomColor: c.primary,
    paddingVertical: 2,
  },
  rowPlusCode: {
    fontSize: 14,
    color: c.primary,
    fontWeight: '500',
  },
  rowCoords: {
    fontSize: 14,
    color: c.textSecondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapButtonText: {
    color: c.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
