// Couleur et image macaron de chaque korrigan — keyed par nom exact en DB
export type KorriganAssets = { color: string; image: ReturnType<typeof require> };

const DATA: Record<string, KorriganAssets> = {
  'Queen Aman':      { color: '#B71C1C', image: require('../assets/korrigans/queen-macaron.png') },
  'Korry Gan':       { color: '#2E7D32', image: require('../assets/korrigans/korry-gan-macaron.png') },
  'Pluzinkopec':     { color: '#5D4037', image: require('../assets/korrigans/plusinkopec-macaron.png') },
  "Epidanl'Bec":     { color: '#F57F17', image: require('../assets/korrigans/epidanlbec-macaron.png') },
  'Cromatik':        { color: '#1565C0', image: require('../assets/korrigans/cromatik-macaron.png') },
  "Marin d'Odouss":  { color: '#C62828', image: require('../assets/korrigans/marin-macaron.png') },
  'Panosolec':       { color: '#33691E', image: require('../assets/korrigans/panosolec-macaron.png') },
  'Beursalec':       { color: '#1A237E', image: require('../assets/korrigans/beursalec-macaron.png') },
  "Captain O'ssec":  { color: '#006064', image: require('../assets/korrigans/captain-macaron.png') },
  'Barbobec':        { color: '#6A1B9A', image: require('../assets/korrigans/barbobec-macaron.png') },
  'Kronomec':        { color: '#E65100', image: require('../assets/korrigans/kronomec-macaron.png') },
  'Rouledépecs':     { color: '#880E4F', image: require('../assets/korrigans/rouledepec-macaron.png') },
  'Darkann':         { color: '#BF360C', image: require('../assets/korrigans/darkann-macaron.png') },
};

export function getKorriganAssets(name: string | undefined): KorriganAssets | undefined {
  if (!name) return undefined;
  return DATA[name];
}
