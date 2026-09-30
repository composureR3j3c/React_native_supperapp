// Every text/background pairing below is 7:1 or better (WCAG AAA) so screens stay readable at a glance
// while driving. Check new colors with a contrast checker before adding them.
export const lightColors = {
  background: '#ffffff',
  surface: '#f7f7f7', // cards and list rows
  surfaceActive: '#ececec', // row being dragged
  text: '#111111',
  textSecondary: '#333333',
  placeholder: '#505050',
  border: '#6b6b6b',
  primary: '#1f5963', // teal accent
  onPrimary: '#ffffff',
  neutralButton: '#333333',
  onNeutralButton: '#ffffff',
  danger: '#a01818',
  success: '#1b5e20',
  spotify: '#1DB954',
  onSpotify: '#000000',
  youtube: '#b00000',
  onYoutube: '#ffffff',
  favorite: '#8a5a00', // starred contacts (brand yellow is too faint on white)
  priority: { none: '#6b6b6b', low: '#1b5e20', medium: '#8a5a00', high: '#a01818' },
};

// Pure black background: least glare at night and saves battery on OLED screens.
export const darkColors = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceActive: '#2c2c2c',
  text: '#f2f2f2',
  textSecondary: '#d6d6d6',
  placeholder: '#b0b0b0',
  border: '#8a8a8a',
  primary: '#7fc8d6',
  onPrimary: '#000000',
  neutralButton: '#3a3a3a',
  onNeutralButton: '#ffffff',
  danger: '#ff9a92',
  success: '#8fd694',
  spotify: '#1DB954',
  onSpotify: '#000000',
  youtube: '#b00000',
  onYoutube: '#ffffff',
  favorite: '#f1ab15',
  priority: { none: '#8a8a8a', low: '#8fd694', medium: '#f1ab15', high: '#ff9a92' },
};
