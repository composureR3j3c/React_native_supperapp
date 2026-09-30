import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lifeos.locations';

export default function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    return AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setLocations(raw ? JSON.parse(raw) : []);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback((next) => {
    setLocations(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addLocation = useCallback(
    (location) => {
      persist([location, ...locations]);
    },
    [locations, persist]
  );

  const deleteLocation = useCallback(
    (id) => {
      persist(locations.filter((location) => location.id !== id));
    },
    [locations, persist]
  );

  const updateLocation = useCallback(
    (id, changes) => {
      persist(locations.map((location) => (location.id === id ? { ...location, ...changes } : location)));
    },
    [locations, persist]
  );

  const markLocationUsed = useCallback(
    (id) => updateLocation(id, { lastUsedAt: Date.now() }),
    [updateLocation]
  );

  return { locations, loaded, addLocation, deleteLocation, updateLocation, markLocationUsed, reload };
}
