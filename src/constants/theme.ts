export const Colors = {
  // Invitation-inspired luxury palette
  gold: '#D4AF37',
  goldLight: '#F0CC50',
  goldDark: '#A8860A',
  goldMuted: '#D4AF3730',
  goldSubtle: '#D4AF3715',

  // Backgrounds — deep black with green undertones
  black: '#0B0B0B',
  darkGray: '#111111',
  cardBg: '#141A12',
  surfaceBg: '#1A2218',
  borderColor: '#2A3828',

  // Safari Green
  safariGreen: '#1D3B2A',
  safariGreenLight: '#2A5A3E',
  safariGreenDark: '#0F2218',

  // Sunset Amber
  amber: '#D88C2D',
  amberLight: '#F0A840',
  amberDark: '#A0640A',

  // Ocean Teal
  teal: '#1B7F8A',
  tealLight: '#24A0AE',
  tealDark: '#0F5560',

  // Text
  white: '#FFFFFF',
  offWhite: '#F8F2E0',
  textPrimary: '#F8F2E0',
  textSecondary: '#B0A070',
  textMuted: '#6A5A40',

  // Legacy aliases used in existing screens
  zanzibar: '#1A8C7A',
  ocean: '#1B7F8A',
  savanna: '#D88C2D',

  // Status
  success: '#4CAF78',
  warning: '#D88C2D',
  error: '#E85A4A',
  info: '#1B7F8A',

  // Transparent
  overlay: 'rgba(0,0,0,0.75)',
  goldOverlay: 'rgba(212,175,55,0.15)',
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  green: {
    shadowColor: Colors.safariGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};
