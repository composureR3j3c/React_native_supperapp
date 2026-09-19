import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { nextPriority } from '../lib/priority';

const STORAGE_KEY = 'lifeos.tasks';

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setTasks(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next) => {
    setTasks(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addTask = useCallback(
    (title) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      persist([{ id: Date.now().toString(), title: trimmed, done: false, priority: 'none' }, ...tasks]);
    },
    [tasks, persist]
  );

  const toggleTask = useCallback(
    (id) => {
      persist(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
    },
    [tasks, persist]
  );

  const deleteTask = useCallback(
    (id) => {
      persist(tasks.filter((task) => task.id !== id));
    },
    [tasks, persist]
  );

  const cyclePriority = useCallback(
    (id) => {
      persist(
        tasks.map((task) => (task.id === id ? { ...task, priority: nextPriority(task.priority) } : task))
      );
    },
    [tasks, persist]
  );

  return { tasks, loaded, addTask, toggleTask, deleteTask, cyclePriority, setAllTasks: persist };
}
