import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { progressApi, huntApi } from '@tresors/shared';
import type { TreasureHuntDTO, UserProgressDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [hunts, setHunts] = useState<TreasureHuntDTO[]>([]);
  const [progresses, setProgresses] = useState<UserProgressDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      huntApi.getAll().then(setHunts).catch(() => {}),
      progressApi.getAll().then(setProgresses).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const inProgress = progresses.filter(p => !p.isCompleted);
  const completed = progresses.filter(p => p.isCompleted);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerStats}>
          <View>
            <Text style={styles.statNumber}>{completed.length}</Text>
            <Text style={styles.statLabel}>{"TRÉSORS"}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statNumber}>{hunts.length}</Text>
            <Text style={styles.statLabel}>PARCOURS</Text>
          </View>
        </View>
        <Text style={styles.headerName}>{user?.name?.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {inProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EN COURS</Text>
            {inProgress.map(p => {
              const hunt = hunts.find(h => h.id === p.treasureHuntId);
              if (!hunt) return null;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.progressCard}
                  onPress={() => router.push(`/hunt/${hunt.id}`)}
                >
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressTitle}>{hunt.title}</Text>
                    <Text style={styles.progressStep}>{"Étape"} {p.currentStep}</Text>
                  </View>
                  <Text style={styles.progressArrow}>{'>'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {hunts.length} PARCOURS DISPONIBLES
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/hunts')}
          >
            <Text style={styles.exploreText}>{"Explorer les chasses"}</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>{"Se déconnecter"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: font.bold,
    color: colors.textWhite,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: font.semibold,
    letterSpacing: 0.5,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: font.bold,
    color: colors.textWhite,
  },
  headerName: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: font.bold,
    color: colors.textWhite,
    letterSpacing: 2,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: font.bold,
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  progressInfo: { flex: 1 },
  progressTitle: {
    fontSize: 15,
    fontWeight: font.bold,
    color: colors.text,
  },
  progressStep: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  progressArrow: {
    color: colors.accent,
    fontSize: 16,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  exploreText: {
    color: colors.textWhite,
    fontWeight: font.bold,
    fontSize: 15,
    letterSpacing: 1,
  },
  logoutButton: {
    margin: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.textLight,
    fontSize: 14,
  },
});
