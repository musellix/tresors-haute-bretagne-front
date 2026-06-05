import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { korriganApi } from '@tresors/shared';
import type { KorriganDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../src/theme';

const KORRIGAN_COLORS = [
  '#A0522D', '#F5C518', '#4A90D9', '#C0392B',
  '#2E7D32', '#8B0000', '#7B68EE', '#E67E22',
  '#16A085', '#6C3483', '#1A5276', '#884EA0',
  '#CB4335',
];

export default function KorrigansScreen() {
  const router = useRouter();
  const [korrigans, setKorrigans] = useState<KorriganDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    korriganApi.getAll()
      .then(setKorrigans)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.titleBar}><Text style={styles.pageTitle}>LES KORRIGANS</Text></View>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.titleBar}>
        <Text style={styles.pageTitle}>LES KORRIGANS</Text>
      </View>
      <FlatList
        data={korrigans}
        keyExtractor={k => String(k.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const bg = KORRIGAN_COLORS[index % KORRIGAN_COLORS.length];
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: bg }]}
              onPress={() => router.push({ pathname: '/(tabs)/hunts', params: { korriganId: item.id } })}
              activeOpacity={0.85}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name.toUpperCase()}</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
              </View>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={{ fontSize: 36 }}>ðŸ§™</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  titleBar: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: font.bold,
    color: colors.text,
    letterSpacing: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderRadius: radius.md,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: font.bold,
    color: colors.textWhite,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardImage: {
    width: 90,
    height: 90,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
