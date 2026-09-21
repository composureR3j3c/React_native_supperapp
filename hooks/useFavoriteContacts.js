import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lifeos.favoriteContactIds';

export default function useFavoriteContacts() {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setFavoriteIds(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

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

  return { favoriteIds, loaded, toggleFavorite, mergeFavorites };
}
