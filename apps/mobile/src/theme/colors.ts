export const Colors = {
  primary: '#8BC34A',
  primaryDark: '#6A9E2D',
  accent: '#E8A020',
  background: '#F5F0E8',
  white: '#FFFFFF',
  textDark: '#2C2C2C',
  textMuted: '#888888',
  border: '#E0D8CC',
  error: '#D32F2F',
  success: '#388E3C',
  card: '#FFFFFF',
  tabBarActive: '#8BC34A',
  tabBarInactive: '#AAAAAA',

  korrigan: {
    pluzinkopec: '#A0785A',
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
  } as Record<string, string>,
};

export function getKorriganColor(name: string): string {
  const key = name.toLowerCase().trim();
  return Colors.korrigan[key] ?? Colors.primary;
}
