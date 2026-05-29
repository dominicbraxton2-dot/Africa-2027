export const Colors = {
  // Primary palette - Luxury gold & black
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldDark: '#A07830',
  goldMuted: '#C9A84C33',

  black: '#0A0A0A',
  darkGray: '#1A1A1A',
  cardBg: '#141414',
  surfaceBg: '#1E1E1E',
  borderColor: '#2A2A2A',

  white: '#FFFFFF',
  offWhite: '#F5F0E8',
  textPrimary: '#F5F0E8',
  textSecondary: '#A09070',
  textMuted: '#6B6050',

  // Accent colors - African-inspired
  savanna: '#D4874A',
  baobab: '#8B6F47',
  ocean: '#2A6B7C',
  zanzibar: '#1A8C7A',
  sunset: '#E8643A',

  // Status
  success: '#4CAF78',
  warning: '#E8B84A',
  error: '#E85A4A',
  info: '#4A8CE8',

  // Transparent
  overlay: 'rgba(0,0,0,0.7)',
  goldOverlay: 'rgba(201,168,76,0.15)',
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
};
