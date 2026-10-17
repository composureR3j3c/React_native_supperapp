// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { localDate, setDaily, toggleDone, toStored, withDerivedDone } from './dailyTasks.js';

const MON = '2026-10-12';
const TUE = '2026-10-13';

test('localDate uses the local calendar date with zero padding', () => {
  assert.equal(localDate(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(localDate(new Date(2026, 11, 31, 0, 0)), '2026-12-31');
});

test('a daily task checked today is undone the next day', () => {
  const task = { id: '1', title: 'Check tyres', daily: true, doneOn: null };
  const checked = toggleDone(task, MON);
  assert.equal(withDerivedDone(checked, MON).done, true);
  assert.equal(withDerivedDone(checked, TUE).done, false);
});

test('unchecking a daily task today clears it; regular tasks just flip', () => {
  assert.equal(toggleDone({ daily: true, doneOn: MON }, MON).doneOn, null);
  assert.equal(toggleDone({ daily: true, doneOn: MON }, TUE).doneOn, TUE); // yesterday's check doesn't count
  assert.equal(toggleDone({ done: false }, MON).done, true);
  assert.equal(withDerivedDone({ done: true }, TUE).done, true); // regular tasks stay done
});

test('converting between regular and daily keeps today\'s state', () => {
  assert.deepEqual(setDaily({ id: '1', done: true }, true, MON), { id: '1', daily: true, doneOn: MON });
  assert.deepEqual(setDaily({ id: '1', done: false }, true, MON), { id: '1', daily: true, doneOn: null });
  assert.deepEqual(setDaily({ id: '1', daily: true, doneOn: MON, done: true }, false, MON), { id: '1', done: true });
  assert.deepEqual(setDaily({ id: '1', daily: true, doneOn: MON, done: false }, false, TUE), { id: '1', done: false });
});

test('stored daily tasks never keep a derived done flag', () => {
  assert.deepEqual(toStored({ id: '1', daily: true, doneOn: MON, done: true }), { id: '1', daily: true, doneOn: MON });
  assert.deepEqual(toStored({ id: '2', done: true }), { id: '2', done: true });
});
