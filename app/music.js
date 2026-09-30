import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { openSpotify, openYouTube } from '../lib/openApps';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export default function MusicScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  return (
    <>
      <Stack.Screen options={{ title: 'Music' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Music</Text>
        <Text style={styles.description}>
          Search for a song or artist, or leave it blank to just open the app.
        </Text>

        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            placeholder="Search a song or artist..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => openSpotify(trimmed)}
            returnKeyType="search"
          />
        </View>

        <Pressable style={[styles.button, styles.spotifyButton]} onPress={() => openSpotify(trimmed)}>
          <MaterialCommunityIcons name="spotify" size={20} color={colors.onSpotify} />
          <Text style={[styles.buttonText, styles.spotifyText]}>Open in Spotify</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.youtubeButton]} onPress={() => openYouTube(trimmed)}>
          <MaterialCommunityIcons name="youtube" size={20} color={colors.onYoutube} />
          <Text style={styles.buttonText}>Open in YouTube</Text>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: c.text,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  spotifyButton: {
    backgroundColor: c.spotify,
  },
  // Spotify green is too light for white text; black gives 8:1.
  spotifyText: {
    color: c.onSpotify,
  },
  youtubeButton: {
    backgroundColor: c.youtube,
  },
  buttonText: {
    color: c.onYoutube,
    fontSize: 15,
    fontWeight: '600',
  },
});
