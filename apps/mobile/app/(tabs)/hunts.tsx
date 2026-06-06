import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { huntApi, themeApi } from '@tresors/shared';
import type { TreasureHuntDTO, ThemeDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../src/theme';

export default function HuntsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ korriganId?: string }>();
  const [hunts, setHunts] = useState<TreasureHuntDTO[]>([]);
  const [themes, setThemes] = useState<ThemeDTO[]>([]);
  const [search, setSearch] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      huntApi.getAll(),
      themeApi.getAll(),
    ]).then(([h, t]) => {
      setHunts(h);
      setThemes(t);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = hunts.filter(h => {
    const matchSearch = h.title.toLowerCase().includes(search.toLowerCase());
    const matchTheme = selectedThemeId ? h.theme?.id === selectedThemeId : true;
    const matchKorrigan = params.korriganId
      ? h.theme?.korrigan?.id === Number(params.korriganId)
      : true;
    return matchSearch && matchTheme && matchKorrigan;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>LES CHASSES</Text>
        <TextInput
          style={styles.search}
          placeholder="Rechercher..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          horizontal
          data={[{ id: 0, name: 'Tous', description: '', korrigan: undefined } as ThemeDTO, ...themes]}
          keyExtractor={t => String(t.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                (item.id === 0 ? selectedThemeId === null : selectedThemeId === item.id)
                  && styles.filterChipActive,
              ]}
              onPress={() => setSelectedThemeId(item.id === 0 ? null : item.id)}
            >
              <Text style={[
                styles.filterText,
                (item.id === 0 ? selectedThemeId === null : selectedThemeId === item.id)
                  && styles.filterTextActive,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading
        ? <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
        : (
          <FlatList
            data={filtered}
            keyExtractor={h => String(h.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>{"Aucun parcours trouvé."}</Text>
            }
            renderItem={({ item }) => (
              <HuntCard hunt={item} onPress={() => router.push(`/hunt/${item.id}`)} />
            )}
          />
        )
      }
    </SafeAreaView>
  );
}

function HuntCard({ hunt, onPress }: { hunt: TreasureHuntDTO; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {hunt.treasureImageUrl ? (
        <Image source={{ uri: hunt.treasureImageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <Text style={{ fontSize: 32 }}>{'🗺️'}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        {hunt.theme && (
          <Text style={styles.cardTheme}>
            {hunt.theme.korrigan?.name?.toUpperCase()} {'·'} {hunt.theme.name?.toUpperCase()}
          </Text>
        )}
        <Text style={styles.cardTitle}>{hunt.title}</Text>
        {hunt.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{hunt.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: font.bold,
    color: colors.text,
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  search: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filters: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: font.semibold,
  },
  filterTextActive: {
    color: colors.textWhite,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textLight,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardImageFallback: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTheme: {
    fontSize: 11,
    fontWeight: font.bold,
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: font.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
