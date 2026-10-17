import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { localDate, setDaily, toggleDone, toStored, withDerivedDone } from '../lib/dailyTasks';
import { nextPriority } from '../lib/priority';

const STORAGE_KEY = 'lifeos.tasks';
const DAY_CHECK_MS = 60 * 1000;

export default function useTasks() {
  const [storedTasks, setStoredTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState(localDate);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setStoredTasks(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  // Notice the day changing, whether the app stays open past midnight or comes back from the background.
  useEffect(() => {
    const refreshDay = () => setToday(localDate());
    const timer = setInterval(refreshDay, DAY_CHECK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDay();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const tasks = useMemo(() => storedTasks.map((task) => withDerivedDone(task, today)), [storedTasks, today]);

  const persist = useCallback((next) => {
    const clean = next.map(toStored);
    setStoredTasks(clean);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }, []);

  const addTask = useCallback(
    (title, { daily = false } = {}) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const base = { id: Date.now().toString(), title: trimmed, priority: 'none' };
      const task = daily ? { ...base, daily: true, doneOn: null } : { ...base, done: false };
      persist([task, ...storedTasks]);
    },
    [storedTasks, persist]
  );

  const toggleTask = useCallback(
    (id) => {
      persist(
        storedTasks.map((task) => (task.id === id ? toggleDone(task, today) : task))
      );
    },
    [storedTasks, persist, today]
  );

  const toggleDaily = useCallback(
    (id) => {
      persist(
        tasks.map((task) => (task.id === id ? setDaily(task, !task.daily, today) : task))
      );
    },
    [tasks, persist, today]
  );

  const deleteTask = useCallback(
    (id) => {
      persist(storedTasks.filter((task) => task.id !== id));
    },
    [storedTasks, persist]
  );

  const cyclePriority = useCallback(
    (id) => {
      persist(
        storedTasks.map((task) => (task.id === id ? { ...task, priority: nextPriority(task.priority) } : task))
      );
    },
    [storedTasks, persist]
  );

  return {
    tasks,
    loaded,
    today,
    addTask,
    toggleTask,
    toggleDaily,
    deleteTask,
    cyclePriority,
    setAllTasks: persist,
  };
}
