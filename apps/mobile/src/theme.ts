export const colors = {
  primary: '#8BC34A',
  primaryDark: '#6A9E2F',
  accent: '#E8A020',
  background: '#F5F0E8',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  textWhite: '#FFFFFF',
  border: '#E0D8CC',
  error: '#D32F2F',
  success: '#4CAF50',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const font = {
  bold: 'bold' as const,
  semibold: '600' as const,
  regular: '400' as const,
};
