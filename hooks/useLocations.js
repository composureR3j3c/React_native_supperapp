import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lifeos.locations';

export default function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setLocations(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

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

  return { locations, loaded, addLocation, deleteLocation };
}
