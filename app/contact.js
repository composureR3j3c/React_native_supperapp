import { Ionicons } from '@expo/vector-icons';
import {
  Contact,
  ContactField,
  ContactsSortOrder,
  requestPermissionsAsync,
} from 'expo-contacts';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import useFavoriteContacts from '../hooks/useFavoriteContacts';
import { callNumber } from '../lib/openApps';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { favoriteIds, loaded: favoritesLoaded, toggleFavorite, mergeFavorites, markContactUsed } =
    useFavoriteContacts();
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'denied' | 'error'
  const [pickerError, setPickerError] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const loadContacts = async () => {
    setStatus('loading');
    try {
      const permission = await requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return;
      }

      const details = await Contact.getAllDetails(
        [ContactField.FULL_NAME, ContactField.PHONES, ContactField.IS_FAVOURITE],
        { sortOrder: ContactsSortOrder.GivenName }
      );
      setContacts(details);

      // Android exposes the phone's real "starred" contacts — pull those in as favorites
      // too, so people don't have to re-star everyone from scratch inside the app.
      const deviceFavoriteIds = details.filter((contact) => contact.isFavourite).map((contact) => contact.id);
      if (deviceFavoriteIds.length > 0) {
        mergeFavorites(deviceFavoriteIds);
      }

      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    // Wait for locally-stored favorites to finish loading before fetching contacts —
    // otherwise the device-favorites merge below could race and overwrite them.
    if (favoritesLoaded) {
      loadContacts();
    }
  }, [favoritesLoaded]);

  const callContact = (id, phone) => {
    if (!phone) return;
    markContactUsed(id);
    callNumber(phone);
  };

  const handleOpenContacts = async () => {
    setPickerError(null);
    try {
      const picked = await Contact.presentPicker();
      if (picked && !favoriteIds.includes(picked.id)) {
        toggleFavorite(picked.id);
        if (!contacts.some((contact) => contact.id === picked.id)) {
          loadContacts();
        }
      }
    } catch {
      setPickerError('Opening Contacts is not supported on this platform.');
    }
  };

  const sections = useMemo(() => {
    const favorites = contacts.filter((contact) => favoriteIds.includes(contact.id));

    if (favoritesOnly) {
      return [{ key: 'favorites', title: 'Most Contacted', data: favorites }];
    }

    const others = contacts.filter((contact) => !favoriteIds.includes(contact.id));
    const result = [];
    if (favorites.length > 0) {
      result.push({ key: 'favorites', title: 'Most Contacted', data: favorites });
    }
    result.push({ key: 'all', title: 'All Contacts', data: others });
    return result;
  }, [contacts, favoriteIds, favoritesOnly]);

  return (
    <>
      <Stack.Screen options={{ title: 'Contacts' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Contacts</Text>
        <Text style={styles.description}>
          Star the people you contact most so they show up first.
        </Text>

        <View style={styles.favoritesRow}>
          <Text style={styles.favoritesLabel}>Show favorites only</Text>
          <Switch value={favoritesOnly} onValueChange={setFavoritesOnly} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} />
        </View>

        {status === 'loading' || !favoritesLoaded ? (
          <ActivityIndicator color={colors.primary} style={styles.centerSpinner} />
        ) : status === 'denied' ? (
          <View style={styles.messageBox}>
            <Text style={styles.message}>
              Contacts permission denied. Enable it in Settings to see your contacts.
            </Text>
            <Pressable style={styles.retryButton} onPress={loadContacts}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : status === 'error' ? (
          <View style={styles.messageBox}>
            <Text style={styles.message}>Could not load contacts. Please try again.</Text>
            <Pressable style={styles.retryButton} onPress={loadContacts}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : favoritesOnly && sections[0].data.length === 0 ? (
          <Text style={styles.message}>
            No favorites yet. Star a contact below to see them here.
          </Text>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            renderItem={({ item }) => {
              const isFavorite = favoriteIds.includes(item.id);
              const phone = item.phones?.[0]?.number;
              return (
                <View style={styles.row}>
                  <Pressable onPress={() => toggleFavorite(item.id)} hitSlop={8}>
                    <Ionicons
                      name={isFavorite ? 'star' : 'star-outline'}
                      size={20}
                      color={isFavorite ? colors.favorite : colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.rowText}
                    onPress={() => callContact(item.id, phone)}
                    disabled={!phone}
                  >
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.fullName || 'Unnamed contact'}
                    </Text>
                    <Text style={styles.rowPhone} numberOfLines={1}>
                      {phone || 'No phone number'}
                    </Text>
                  </Pressable>
                  {phone ? (
                    <Ionicons name="call-outline" size={20} color={colors.success} />
                  ) : null}
                </View>
              );
            }}
          />
        )}

        {pickerError ? <Text style={styles.pickerError}>{pickerError}</Text> : null}
        <Pressable style={styles.contactsLink} onPress={handleOpenContacts}>
          <Ionicons name="people" size={18} color={colors.textSecondary} />
          <Text style={styles.contactsLinkText}>Open Contacts</Text>
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
  favoritesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoritesLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  centerSpinner: {
    marginTop: 40,
  },
  messageBox: {
    gap: 12,
  },
  message: {
    color: c.textSecondary,
    fontSize: 14,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: c.neutralButton,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: c.onNeutralButton,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: c.surface,
    borderRadius: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 15,
    color: c.text,
  },
  rowPhone: {
    fontSize: 14,
    color: c.textSecondary,
  },
  contactsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  contactsLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  pickerError: {
    color: c.danger,
    fontSize: 14,
    textAlign: 'center',
  },
});
