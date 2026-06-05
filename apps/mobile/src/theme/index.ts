export const colors = {
  primary: '#8BC34A',
  primaryDark: '#6A9E2D',
  accent: '#E8A020',
  background: '#F5F0E8',
  card: '#FFFFFF',
  text: '#2C2C2C',
  textLight: '#888888',
  textWhite: '#FFFFFF',
  border: '#E0D8CC',
  error: '#D32F2F',
  success: '#388E3C',
  tabActive: '#8BC34A',
  tabInactive: '#AAAAAA',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};

export const font = {
  bold: '700' as const,
  semibold: '600' as const,
  regular: '400' as const,
};

export function getKorriganColor(name: string): string {
  const map: Record<string, string> = {
    pluzinkopec: '#A0522D',
    "epidanl'bec": '#D4A017',
    epidanlbec: '#D4A017',
    cromatik: '#4A90D9',
    "marin d'odouss": '#C0392B',
    panosolec: '#27AE60',
    beursalec: '#E74C3C',
    'queen aman': '#8E44AD',
    queenaman: '#8E44AD',
    barbobec: '#E67E22',
    darkann: '#2C3E50',
    'captain ossec': '#2980B9',
    kronomec: '#16A085',
    rouledepec: '#7D3C98',
    selfie: '#F39C12',
    poudre: '#E91E63',
  };
  return map[name.toLowerCase().trim()] ?? colors.primary;
}
