import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lifeos.favoriteContactIds';
// Contact id -> timestamp of the last call made from the app, for "last used" ordering.
const LAST_USED_KEY = 'lifeos.contactLastUsed';

export default function useFavoriteContacts() {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [lastUsed, setLastUsed] = useState({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    return AsyncStorage.multiGet([STORAGE_KEY, LAST_USED_KEY])
      .then(([[, rawIds], [, rawLastUsed]]) => {
        setFavoriteIds(rawIds ? JSON.parse(rawIds) : []);
        setLastUsed(rawLastUsed ? JSON.parse(rawLastUsed) : {});
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback((next) => {
    setFavoriteIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleFavorite = useCallback(
    (id) => {
      persist(
        favoriteIds.includes(id) ? favoriteIds.filter((favId) => favId !== id) : [...favoriteIds, id]
      );
    },
    [favoriteIds, persist]
  );

  const mergeFavorites = useCallback(
    (ids) => {
      const newIds = ids.filter((id) => !favoriteIds.includes(id));
      if (newIds.length > 0) {
        persist([...favoriteIds, ...newIds]);
      }
    },
    [favoriteIds, persist]
  );

  const markContactUsed = useCallback(
    (id) => {
      const next = { ...lastUsed, [id]: Date.now() };
      setLastUsed(next);
      AsyncStorage.setItem(LAST_USED_KEY, JSON.stringify(next));
    },
    [lastUsed]
  );

  return { favoriteIds, lastUsed, loaded, toggleFavorite, mergeFavorites, markContactUsed, reload };
}
