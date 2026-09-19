export const PRIORITIES = ['none', 'low', 'medium', 'high'];

export const PRIORITY_ORDER = ['high', 'medium', 'low', 'none'];

export const PRIORITY_COLORS = {
  none: '#bbbbbb',
  low: '#2e7d32',
  medium: '#f1ab15',
  high: '#d32f2f',
};

export const PRIORITY_LABELS = {
  none: 'No priority',
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
};

export function nextPriority(current) {
  const index = PRIORITIES.indexOf(current ?? 'none');
  return PRIORITIES[(index + 1) % PRIORITIES.length];
}
