// Groups wallet transactions into calendar weeks (Monday start) or months, in local time, for period comparison.

export function periodStart(time, unit) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  if (unit === 'month') {
    date.setDate(1);
  } else {
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  }
  return date;
}

function addPeriods(start, unit, n) {
  if (unit === 'month') return new Date(start.getFullYear(), start.getMonth() + n, 1);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * n);
}

function periodLabel(start, unit) {
  return unit === 'month'
    ? start.toLocaleDateString(undefined, { month: 'short' })
    : start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// The `count` most recent periods, oldest first, ending with the one containing `now`.
// Only transactions in `currency` are counted, so totals are never mixed across currencies.
export function buildPeriods(transactions, { unit, count, currency, now = Date.now() }) {
  const current = periodStart(now, unit);
  const periods = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = addPeriods(current, unit, -i);
    periods.push({ key: start.getTime(), start, end: addPeriods(start, unit, 1), label: periodLabel(start, unit), in: 0, out: 0, categories: {} });
  }

  for (const tx of transactions) {
    if (tx.currency !== currency) continue;
    const time = new Date(tx.date).getTime();
    const period = periods.find((p) => time >= p.start.getTime() && time < p.end.getTime());
    if (!period) continue;
    period[tx.direction] += tx.amount;
    const category = (period.categories[tx.category ?? 'other'] ??= { in: 0, out: 0 });
    category[tx.direction] += tx.amount;
  }
  return periods;
}

// The currency most transactions use; charts show that one.
export function mainCurrency(transactions) {
  const counts = {};
  for (const tx of transactions) counts[tx.currency] = (counts[tx.currency] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ETB';
}

// Percent change from `previous` to `current`, or null when there is nothing to compare against.
export function percentChange(current, previous) {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}
