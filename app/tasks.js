import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import useTasks from '../hooks/useTasks';
import { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ORDER } from '../lib/priority';

export default function TasksScreen() {
  const { tasks, loaded, addTask, toggleTask, deleteTask, cyclePriority, setAllTasks } = useTasks();
  const [title, setTitle] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  const handleAdd = () => {
    addTask(title);
    setTitle('');
  };

  const visibleTasks = useMemo(
    () => (hideCompleted ? tasks.filter((task) => !task.done) : tasks),
    [tasks, hideCompleted]
  );

  const sections = useMemo(
    () =>
      PRIORITY_ORDER.map((priority) => ({
        priority,
        title: PRIORITY_LABELS[priority],
        data: visibleTasks.filter((task) => (task.priority ?? 'none') === priority),
      })).filter((section) => section.data.length > 0),
    [visibleTasks]
  );

  const flatData = useMemo(() => {
    const out = [];
    sections.forEach((section) => {
      out.push({
        type: 'header',
        key: `header-${section.priority}`,
        priority: section.priority,
        title: section.title,
        count: section.data.length,
      });
      section.data.forEach((task) => out.push({ type: 'task', key: task.id, task }));
    });
    return out;
  }, [sections]);

  const handleDragEnd = ({ data, from }) => {
    const movedKey = flatData[from]?.key;
    if (!movedKey) return;

    let currentPriority = 'none';
    const reordered = [];
    data.forEach((entry) => {
      if (entry.type === 'header') {
        currentPriority = entry.priority;
        return;
      }
      reordered.push(
        entry.key === movedKey ? { ...entry.task, priority: currentPriority } : entry.task
      );
    });

    // Tasks hidden by "Hide completed" aren't part of flatData — keep them, just append after.
    const hiddenTasks = hideCompleted ? tasks.filter((task) => task.done) : [];
    setAllTasks([...reordered, ...hiddenTasks]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Tasks' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a task..."
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.hideRow}>
            <Text style={styles.hideLabel}>Hide completed</Text>
            <Switch value={hideCompleted} onValueChange={setHideCompleted} />
          </View>

          {loaded && sections.length === 0 ? (
            <Text style={styles.empty}>
              {tasks.length === 0
                ? 'No tasks yet. Add your first one above.'
                : 'No pending tasks — nice work!'}
            </Text>
          ) : (
            <DraggableFlatList
              data={flatData}
              keyExtractor={(entry) => entry.key}
              contentContainerStyle={styles.list}
              onDragEnd={handleDragEnd}
              activationDistance={12}
              renderItem={({ item: entry, drag, isActive }) => {
                if (entry.type === 'header') {
                  return (
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionDot, { backgroundColor: PRIORITY_COLORS[entry.priority] }]} />
                      <Text style={styles.sectionTitle}>{entry.title}</Text>
                      <Text style={styles.sectionCount}>{entry.count}</Text>
                    </View>
                  );
                }

                const item = entry.task;
                const priority = item.priority ?? 'none';
                return (
                  <ScaleDecorator>
                    <View style={[styles.row, isActive && styles.rowActive]}>
                      <Pressable
                        onLongPress={drag}
                        disabled={isActive}
                        hitSlop={8}
                        accessibilityLabel="Drag to reorder or change priority group"
                      >
                        <Ionicons name="reorder-three-outline" size={22} color="#999" />
                      </Pressable>
                      <Pressable style={styles.rowMain} onPress={() => toggleTask(item.id)}>
                        <Ionicons
                          name={item.done ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={item.done ? '#2e7d32' : '#666'}
                        />
                        <Text style={[styles.rowText, item.done && styles.rowTextDone]} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => cyclePriority(item.id)}
                        hitSlop={8}
                        accessibilityLabel={PRIORITY_LABELS[priority]}
                      >
                        <Ionicons
                          name={priority === 'none' ? 'flag-outline' : 'flag'}
                          size={20}
                          color={PRIORITY_COLORS[priority]}
                        />
                      </Pressable>
                      <Pressable onPress={() => deleteTask(item.id)} hitSlop={8} style={styles.trashButton}>
                        <Ionicons name="trash-outline" size={20} color="#c62828" />
                      </Pressable>
                    </View>
                  </ScaleDecorator>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hideLabel: {
    fontSize: 14,
    color: '#444',
  },
  empty: {
    color: '#888',
    fontSize: 14,
  },
  list: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
  },
  rowActive: {
    backgroundColor: '#ececec',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    color: '#222',
    flexShrink: 1,
  },
  rowTextDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  trashButton: {
    marginLeft: 2,
  },
});
