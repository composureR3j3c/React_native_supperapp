import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import Section from '../../components/Section';
import useFavoriteContacts from '../../hooks/useFavoriteContacts';
import useLocations from '../../hooks/useLocations';
import { callNumber, openInMaps, openSpotify, openYouTube } from '../../lib/openApps';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

const TOP_PLACES = 2;
const MAX_CONTACTS = 8;
const CONTACT_COLUMNS = 4;
const PADDING = 20;
const GAP = 12;

function initials(name) {
  const letters = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase());
  return letters.join('') || '?';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const { locations, markLocationUsed, reload: reloadLocations } = useLocations();
  const { favoriteIds, lastUsed, loaded: favoritesLoaded, markContactUsed, reload: reloadFavorites } =
    useFavoriteContacts();
  const [favoriteContacts, setFavoriteContacts] = useState([]);
  const [contactsAllowed, setContactsAllowed] = useState(true);

  // Places and favorites are edited on other screens, so refresh whenever the dashboard comes back into view.
  useFocusEffect(
    useCallback(() => {
      reloadLocations();
      reloadFavorites();
    }, [reloadLocations, reloadFavorites])
  );

  const loadFavoriteContacts = useCallback(async () => {
    try {
      const permission = await getPermissionsAsync();
      setContactsAllowed(permission.granted);
      if (!permission.granted) return;

      // Most recently called first; favorites never called keep their starred order (sort is stable).
      const ordered = [...favoriteIds]
        .sort((a, b) => (lastUsed[b] ?? 0) - (lastUsed[a] ?? 0))
        .slice(0, MAX_CONTACTS);
      const details = await Promise.all(
        ordered.map((id) =>
          new Contact(id)
            .getDetails([ContactField.FULL_NAME, ContactField.PHONES])
            .then((contact) => ({ id, name: contact.fullName, phone: contact.phones?.[0]?.number }))
            .catch(() => null) // Contact was deleted from the phone.
        )
      );
      setFavoriteContacts(details.filter(Boolean));
    } catch {
      setFavoriteContacts([]);
    }
  }, [favoriteIds, lastUsed]);

  useFocusEffect(
    useCallback(() => {
      if (favoritesLoaded) loadFavoriteContacts();
    }, [favoritesLoaded, loadFavoriteContacts])
  );

  const allowContacts = async () => {
    await requestPermissionsAsync();
    loadFavoriteContacts();
  };

  const topPlaces = [...locations]
    .sort((a, b) => (b.lastUsedAt ?? b.savedAt) - (a.lastUsedAt ?? a.savedAt))
    .slice(0, TOP_PLACES);

  const contactSize = (width - PADDING * 2 - GAP * (CONTACT_COLUMNS - 1)) / CONTACT_COLUMNS;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="Music" actionLabel="Search" onAction={() => router.push('/music')}>
        <View style={styles.row}>
          <Pressable
            style={[styles.bigButton, { backgroundColor: colors.spotify }]}
            onPress={() => openSpotify()}
            accessibilityLabel="Open Spotify"
          >
            <MaterialCommunityIcons name="spotify" size={40} color={colors.onSpotify} />
            <Text style={[styles.bigButtonLabel, { color: colors.onSpotify }]}>Spotify</Text>
          </Pressable>
          <Pressable
            style={[styles.bigButton, { backgroundColor: colors.youtube }]}
            onPress={() => openYouTube()}
            accessibilityLabel="Open YouTube"
          >
            <MaterialCommunityIcons name="youtube" size={40} color={colors.onYoutube} />
            <Text style={[styles.bigButtonLabel, { color: colors.onYoutube }]}>YouTube</Text>
          </Pressable>
        </View>
      </Section>

      <Section title="Places" actionLabel="All places" onAction={() => router.push('/location')}>
        <View style={styles.row}>
          {topPlaces.map((place) => (
            <Pressable
              key={place.id}
              style={styles.placeButton}
              onPress={() => {
                markLocationUsed(place.id);
                openInMaps(place.latitude, place.longitude, place.label);
              }}
              accessibilityLabel={`Open ${place.label} in Maps`}
            >
              <View style={styles.placeIcon}>
                <Ionicons name="navigate" size={24} color={colors.onPrimary} />
              </View>
              <Text style={styles.placeLabel} numberOfLines={2}>
                {place.label}
              </Text>
            </Pressable>
          ))}
          {topPlaces.length < TOP_PLACES ? (
            <Pressable
              style={[styles.placeButton, styles.addButton]}
              onPress={() => router.push('/location')}
              accessibilityLabel="Save a place"
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.placeLabel}>Save a place</Text>
            </Pressable>
          ) : null}
        </View>
      </Section>

      <Section title="Favorites" actionLabel="All contacts" onAction={() => router.push('/contact')}>
        {!contactsAllowed ? (
          <Pressable style={styles.inlineButton} onPress={allowContacts}>
            <Ionicons name="people" size={20} color={colors.onNeutralButton} />
            <Text style={styles.inlineButtonText}>Allow contacts to show favorites</Text>
          </Pressable>
        ) : favoriteContacts.length === 0 ? (
          <Pressable style={styles.inlineButton} onPress={() => router.push('/contact')}>
            <Ionicons name="star" size={20} color={colors.onNeutralButton} />
            <Text style={styles.inlineButtonText}>Star contacts to add them here</Text>
          </Pressable>
        ) : (
          <View style={[styles.row, styles.wrap]}>
            {favoriteContacts.map((contact) => (
              <Pressable
                key={contact.id}
                style={[styles.contactButton, { width: contactSize }]}
                onPress={() => {
                  markContactUsed(contact.id);
                  callNumber(contact.phone);
                }}
                disabled={!contact.phone}
                accessibilityLabel={contact.phone ? `Call ${contact.name}` : `${contact.name}, no phone number`}
              >
                <View style={[styles.avatar, !contact.phone && styles.avatarDisabled]}>
                  <Text style={[styles.avatarText, !contact.phone && styles.avatarTextDisabled]}>
                    {initials(contact.name)}
                  </Text>
                </View>
                <Text style={styles.contactName} numberOfLines={1}>
                  {contact.name || 'Unnamed'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: PADDING,
      gap: 24,
    },
    row: {
      flexDirection: 'row',
      gap: GAP,
    },
    wrap: {
      flexWrap: 'wrap',
    },
    bigButton: {
      flex: 1,
      height: 96,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    bigButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    placeButton: {
      flex: 1,
      minHeight: 96,
      borderRadius: 20,
      padding: 14,
      gap: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
    },
    addButton: {
      alignItems: 'center',
      borderStyle: 'dashed',
    },
    placeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    contactButton: {
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarDisabled: {
      backgroundColor: c.neutralButton,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '700',
      color: c.onPrimary,
    },
    avatarTextDisabled: {
      color: c.onNeutralButton,
    },
    contactName: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    inlineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: c.neutralButton,
    },
    inlineButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.onNeutralButton,
    },
  });
