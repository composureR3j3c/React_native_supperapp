// Daily tasks don't store `done`. They store `doneOn`, the local date they were last checked, and count as
// done only on that date — so they come back undone each new day without anything having to run at midnight.

// Local calendar date, e.g. "2026-10-16".
export function localDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function withDerivedDone(task, today) {
  return task.daily ? { ...task, done: task.doneOn === today } : task;
}

export function toggleDone(task, today) {
  if (task.daily) return { ...task, doneOn: task.doneOn === today ? null : today };
  return { ...task, done: !task.done };
}

// Converts a task between regular and daily, keeping whether it's done today.
export function setDaily(task, daily, today) {
  if (daily) {
    const { done, ...rest } = task;
    return { ...rest, daily: true, doneOn: done ? today : null };
  }
  const { doneOn, daily: _wasDaily, ...rest } = task;
  return { ...rest, done: doneOn === today || task.done === true };
}

// Storage form: daily tasks never keep a derived `done`.
export function toStored(task) {
  if (!task.daily) return task;
  const { done, ...rest } = task;
  return rest;
}
