import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { huntApi, progressApi } from '@tresors/shared';
import type { TreasureHuntDTO, UserProgressDTO, StepDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../src/theme';
import { getKorriganAssets } from '../../src/korrigans';

export default function HuntDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const huntId = Number(id);

  const [hunt, setHunt] = useState<TreasureHuntDTO | null>(null);
  const [progress, setProgress] = useState<UserProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([
      huntApi.getById(huntId),
      progressApi.get(huntId).catch(() => null),
    ]).then(([h, p]) => {
      setHunt(h);
      setProgress(p);
    }).finally(() => setLoading(false));
  }, [huntId]);

  const handlePlay = async () => {
    if (!hunt) return;
    setStarting(true);
    try {
      const p = await progressApi.start(huntId);
      setProgress(p);
      router.push(`/hunt/${huntId}/play`);
    } catch (e: any) {
      console.error('Start hunt error:', e?.response?.status, JSON.stringify(e?.response?.data));
      Alert.alert('Erreur', 'Impossible de démarrer la chasse.');
    } finally {
      setStarting(false);
    }
  };

  const handleContinue = () => router.push(`/hunt/${huntId}/play`);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!hunt) return null;

  const korrigan = hunt.theme?.korrigan;
  const theme = hunt.theme;
  const stepCount = hunt.steps?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image de tête */}
        <View style={styles.heroContainer}>
          {hunt.treasureImageUrl ? (
            <Image source={{ uri: hunt.treasureImageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]}>
              <Text style={{ fontSize: 60 }}>🏆</Text>
            </View>
          )}

          {/* Bouton retour */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {/* Avatar korrigan centré sur la photo */}
          <View style={styles.korriganAvatarWrapper}>
            {korrigan?.imageUrl ? (
              <Image source={{ uri: korrigan.imageUrl }} style={styles.korriganAvatar} />
            ) : (
              <View style={[styles.korriganAvatar, styles.korriganAvatarFallback]}>
                <Text style={{ fontSize: 32 }}>🧙</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Badge thème */}
          {theme && (
            <Text style={styles.themeBadge}>
              {theme.name?.toUpperCase()}
            </Text>
          )}

          {/* Titre */}
          <Text style={styles.title}>{hunt.title}</Text>

          {/* Description */}
          {hunt.description ? (
            <Text style={styles.description}>{hunt.description}</Text>
          ) : null}

          {/* Infos */}
          <View style={styles.infoRow}>
            <InfoBadge label="ÉTAPES" value={String(stepCount)} />
            <InfoBadge label="THÈME" value={theme?.name ?? '—'} />
            {korrigan && <InfoBadge label="KORRIGAN" value={korrigan.name} />}
          </View>

          {/* Badge trésor découvert */}
          {progress?.isCompleted && (
            <View style={[styles.progressBanner, styles.progressBannerDone]}>
              <Text style={styles.progressBannerText}>✅ Trésor découvert !</Text>
            </View>
          )}
        </View>

        {/* Préambule — dialogues intro de l'étape 1 */}
        <Preamble steps={hunt.steps} />

        {/* CTA en bas du scroll, après le préambule */}
        <View style={styles.cta}>
          {!progress || progress.isCompleted ? (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handlePlay}
              disabled={starting}
            >
              {starting
                ? <ActivityIndicator color={colors.textWhite} />
                : <Text style={styles.ctaText}>
                    {progress?.isCompleted ? '▶  REJOUER' : '🚀  DÉMARRER LA CHASSE'}
                  </Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.ctaStack}>
              <TouchableOpacity style={styles.ctaButton} onPress={handleContinue}>
                <Text style={styles.ctaText}>▶  CONTINUER LE PARCOURS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ctaButton, styles.ctaButtonSecondary]}
                onPress={handlePlay}
                disabled={starting}
              >
                {starting
                  ? <ActivityIndicator color={colors.primary} />
                  : <Text style={styles.ctaTextSecondary}>↺  RECOMMENCER DEPUIS LE DÉBUT</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Preamble({ steps }: { steps?: StepDTO[] }) {
  // L'étape 0 est le préambule — dialogues affichés avant de démarrer
  const introStep = steps?.find(s => s.stepOrder === 0);
  const dialogues = introStep?.content?.filter(c => c.type === 'dialogue' && c.dialogue) ?? [];
  if (dialogues.length === 0) return null;

  return (
    <View style={styles.preamble}>
      <Text style={styles.preambleTitle}>PRÉAMBULE</Text>
      {dialogues.map((item, i) => {
        const name = item.dialogue!.korrigan?.name;
        const ka = getKorriganAssets(name);
        return (
          <View key={i} style={styles.preambleLine}>
            {ka ? (
              <Image source={ka.image} style={styles.preambleAvatar} />
            ) : (
              <View style={[styles.preambleAvatar, styles.preambleAvatarFallback]}>
                <Text style={{ fontSize: 18 }}>🧙</Text>
              </View>
            )}
            <View style={styles.preambleBubble}>
              <Text style={[styles.preambleSpeaker, ka && { color: ka.color }]}>
                {name ?? 'Korrigan'}
              </Text>
              <Text style={styles.preambleText}>{item.dialogue!.text}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  heroFallback: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: font.bold,
  },
  korriganAvatarWrapper: {
    position: 'absolute',
    bottom: -36,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -36,
  },
  korriganAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.textWhite,
    resizeMode: 'cover',
  },
  korriganAvatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: 48,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  themeBadge: {
    textAlign: 'center',
    color: colors.accent,
    fontWeight: font.bold,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: font.bold,
    color: colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: font.bold,
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: font.bold,
    color: colors.text,
    marginTop: 2,
  },
  progressBanner: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  progressBannerDone: {
    backgroundColor: colors.success,
  },
  progressBannerText: {
    color: colors.textWhite,
    fontWeight: font.bold,
    fontSize: 15,
  },
  cta: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaStack: {
    gap: spacing.sm,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: colors.textWhite,
    fontWeight: font.bold,
    fontSize: 16,
    letterSpacing: 1,
  },
  ctaTextSecondary: {
    color: colors.textLight,
    fontWeight: font.semibold,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Préambule
  preamble: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  preambleTitle: {
    fontSize: 13,
    fontWeight: font.bold,
    color: colors.textLight,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  preambleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  preambleAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    resizeMode: 'cover',
  },
  preambleAvatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preambleBubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preambleSpeaker: {
    fontSize: 11,
    fontWeight: font.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preambleText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
