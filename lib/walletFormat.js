export const MASK = '••••••';

export function formatAmount(amount, currency) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Short axis/chip form: 950, 12.4k, 1.2M.
export function formatCompact(amount) {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(amount));
}

export function formatWhen(date) {
  return new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export const belongsTo = (account) => (item) =>
  item.sender === account.sender && item.accountLast4 === account.accountLast4;

// [[currency, total], ...] of `field` across items, e.g. balances or amounts.
export function totalsByCurrency(items, field) {
  const totals = {};
  for (const item of items) {
    totals[item.currency] = (totals[item.currency] ?? 0) + item[field];
  }
  return Object.entries(totals);
}
