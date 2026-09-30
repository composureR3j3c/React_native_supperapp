export const PRIORITIES = ['none', 'low', 'medium', 'high'];

export const PRIORITY_ORDER = ['high', 'medium', 'low', 'none'];

// Priority colors depend on the theme: see `priority` in theme/colors.js.

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
