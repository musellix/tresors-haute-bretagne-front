import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { huntApi, progressApi } from '@tresors/shared';
import type { StepDTO, DialogueDTO, QuestionDTO, UserProgressDTO, StepContentItemDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../../src/theme';

type Phase = 'loading' | 'proximity' | 'content' | 'treasure' | 'code' | 'completed';

export default function PlayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const huntId = Number(id);

  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState<UserProgressDTO | null>(null);
  const [step, setStep] = useState<StepDTO | null>(null);
  const [steps, setSteps] = useState<StepDTO[]>([]);

  // Proximity
  const [proximity, setProximity] = useState<{ distanceMeters: number; radiusMeters: number } | null>(null);
  const [checkingGps, setCheckingGps] = useState(false);

  // Content (dialogues + questions unified)
  const [contentIndex, setContentIndex] = useState(0);

  // Questions
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Treasure
  const [treasureCoords, setTreasureCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [code, setCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const [prog, allSteps] = await Promise.all([
        progressApi.get(huntId),
        huntApi.getSteps(huntId),
      ]);
      setProgress(prog);
      setSteps(allSteps);

      if (prog.isCompleted) { setPhase('completed'); return; }
      if (prog.isTreasureUnlocked) {
        await loadTreasureCoords();
        setPhase('treasure');
        return;
      }

      const currentStep = allSteps.find(s => s.stepOrder === prog.currentStep);
      if (!currentStep) { setPhase('loading'); return; }

      setStep(currentStep);
      setPhase('proximity');
    } catch (e: any) {
      console.error('loadProgress error:', e?.response?.status, JSON.stringify(e?.response?.data), e?.message);
      Alert.alert('Erreur', 'Impossible de charger la progression.');
      router.back();
    }
  };

  const loadTreasureCoords = async () => {
    try {
      const coords = await progressApi.getTreasureCoordinates(huntId);
      setTreasureCoords(coords);
    } catch {}
  };

  // ── PHASE : PROXIMITY ──────────────────────────────────────────────────────

  const checkProximity = async () => {
    if (!step) return;
    setCheckingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS refusé', 'Autorise la localisation pour jouer.');
        setCheckingGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const result = await progressApi.checkProximity(
        huntId, step.id, loc.coords.latitude, loc.coords.longitude,
      );
      setProximity({ distanceMeters: result.distanceMeters, radiusMeters: result.radiusMeters });
      if (result.withinRange) {
        setContentIndex(0);
        setPhase('content');
      }
    } catch {
      Alert.alert('Erreur GPS', 'Impossible de vérifier ta position.');
    } finally {
      setCheckingGps(false);
    }
  };

  // ── PHASE : SUBMIT ANSWERS (when reaching a question) ─────────────────────

  const submitAnswer = async (questionId: number, answer: string) => {
    if (!step) return false;
    setSubmitting(true);
    try {
      const payload = [{ questionId, answer }];
      const result = await progressApi.submitAnswers(huntId, step.id, { answers: payload });

      if (result.allCorrect) {
        // This question is correct, continue to next content
        return true;
      } else {
        // Wrong answer
        setWrongIds([questionId]);
        Alert.alert('Pas tout à fait !', 'Cette réponse est incorrecte. Essaie encore.');
        return false;
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre la réponse.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentComplete = async () => {
    // When all content is done, check if we should advance to next step or treasure
    const updated = await progressApi.get(huntId);
    setProgress(updated);
    if (updated.isTreasureUnlocked) {
      await loadTreasureCoords();
      setPhase('treasure');
    } else {
      // Next step
      const next = steps.find(s => s.stepOrder === updated.currentStep);
      if (next) {
        setStep(next);
        setAnswers({});
        setWrongIds([]);
        setProximity(null);
        setContentIndex(0);
        setPhase('proximity');
      }
    }
  };

  // ── PHASE : CODE ───────────────────────────────────────────────────────────

  const validateCode = async () => {
    setValidatingCode(true);
    try {
      await progressApi.validateCode(huntId, code.trim().toUpperCase());
      setPhase('completed');
    } catch {
      Alert.alert('Code incorrect', 'Le code saisi ne correspond pas. Cherche encore !');
    } finally {
      setValidatingCode(false);
    }
  };

  // ── RENDUS ─────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    return <CompletedView onBack={() => router.replace(`/hunt/${huntId}`)} />;
  }

  if (phase === 'proximity') {
    return (
      <ProximityView
        step={step!}
        steps={steps}
        progress={progress!}
        proximity={proximity}
        checking={checkingGps}
        onCheck={checkProximity}
        onBypass={() => { setContentIndex(0); setPhase('content'); }}
        onRestart={async () => {
          try {
            await progressApi.start(huntId);
            await loadProgress();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de recommencer le parcours.');
          }
        }}
        onPrevStep={() => {
          if (progress && progress.currentStep > 1) {
            const prevStep = steps.find(s => s.stepOrder === progress.currentStep - 1);
            if (prevStep) {
              setStep(prevStep);
              setAnswers({});
              setWrongIds([]);
              setProximity(null);
              setDialogueIndex(0);
              setPhase('proximity');
            }
          }
        }}
        onBack={() => router.back()}
      />
    );
  }

  if (phase === 'content') {
    const content = step?.content ?? [];
    if (content.length === 0 || contentIndex >= content.length) {
      handleContentComplete();
      return null;
    }

    const currentItem = content[contentIndex];

    if (currentItem.type === 'dialogue' && currentItem.dialogue) {
      return (
        <DialogueView
          dialogue={currentItem.dialogue}
          stepTitle={step?.title ?? ''}
          currentIndex={contentIndex}
          totalCount={content.length}
          onNext={() => setContentIndex(i => i + 1)}
          onBack={() => router.back()}
        />
      );
    }

    if (currentItem.type === 'question' && currentItem.question) {
      return (
        <QuestionView
          question={currentItem.question}
          stepTitle={step?.title ?? ''}
          currentIndex={contentIndex}
          totalCount={content.length}
          answer={answers[currentItem.question.id] ?? ''}
          isWrong={wrongIds.includes(currentItem.question.id)}
          submitting={submitting}
          onChange={(val) => setAnswers(a => ({ ...a, [currentItem.question!.id]: val }))}
          onNext={async () => {
            const isCorrect = await submitAnswer(currentItem.question!.id, answers[currentItem.question!.id] ?? '');
            if (isCorrect) {
              setContentIndex(i => i + 1);
            }
          }}
          onBack={() => router.back()}
        />
      );
    }

    return null;
  }

  if (phase === 'treasure') {
    return (
      <TreasureView
        coords={treasureCoords}
        code={code}
        onCodeChange={setCode}
        validating={validatingCode}
        onValidate={validateCode}
        onBack={() => router.back()}
      />
    );
  }

  return null;
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function ProximityView({ step, steps, progress, proximity, checking, onCheck, onBypass, onRestart, onPrevStep, onBack }: {
  step: StepDTO;
  steps: StepDTO[];
  progress: UserProgressDTO;
  proximity: { distanceMeters: number; radiusMeters: number } | null;
  checking: boolean;
  onCheck: () => void;
  onBypass: () => void;
  onRestart: () => void;
  onPrevStep: () => void;
  onBack: () => void;
}) {
  const isFar = proximity && !proximity.distanceMeters ? false
    : proximity ? proximity.distanceMeters > proximity.radiusMeters : false;

  const canGoPrev = progress.currentStep > 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>ÉTAPE {step.stepOrder}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.centered}>
        <Text style={styles.phaseEmoji}>📍</Text>
        <Text style={styles.phaseTitle}>{step.title}</Text>
        {step.description ? <Text style={styles.phaseDesc}>{step.description}</Text> : null}

        {proximity && isFar && (
          <View style={styles.distanceBanner}>
            <Text style={styles.distanceText}>
              Tu es à <Text style={{ fontWeight: font.bold }}>{proximity.distanceMeters} m</Text> de l'étape.{'\n'}
              Rapproche-toi ({proximity.radiusMeters} m max).
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={onCheck} disabled={checking}>
          {checking
            ? <ActivityIndicator color={colors.textWhite} />
            : <Text style={styles.primaryButtonText}>{'📡  VÉRIFIER MA POSITION'}</Text>
          }
        </TouchableOpacity>

        {/* Navigation dans le parcours - seulement si pas à l'étape 1 */}
        {step.stepOrder > 1 && (
          <View style={styles.navButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onPrevStep}
            >
              <Text style={styles.secondaryButtonText}>{'← Étape précédente'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onRestart}
            >
              <Text style={styles.secondaryButtonText}>{'🔄 Recommencer'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DEV ONLY — à supprimer en production */}
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 12, backgroundColor: '#888' }]}
          onPress={onBypass}
        >
          <Text style={styles.primaryButtonText}>{'🧪  [DEV] IGNORER GPS'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DialogueView({ dialogue, stepTitle, currentIndex, totalCount, onNext, onBack }: {
  dialogue: DialogueDTO;
  stepTitle: string;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>{stepTitle}</Text>
        <Text style={styles.navCounter}>{currentIndex + 1}/{totalCount}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.dialogueContainer}>
        <View style={styles.dialogueLine}>
          {dialogue.korrigan?.imageUrl ? (
            <Image source={{ uri: dialogue.korrigan.imageUrl }} style={styles.dialogueAvatar} />
          ) : (
            <View style={[styles.dialogueAvatar, styles.dialogueAvatarFallback]}>
              <Text style={{ fontSize: 22 }}>🧙</Text>
            </View>
          )}
          <View style={styles.dialogueBubble}>
            <Text style={styles.dialogueSpeaker}>{dialogue.korrigan?.name ?? 'Korrigan'}</Text>
            <Text style={styles.dialogueText}>{dialogue.text}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.dialogueFooter}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>➡  SUITE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function QuestionView({ question, stepTitle, currentIndex, totalCount, answer, isWrong, submitting, onChange, onNext, onBack }: {
  question: QuestionDTO;
  stepTitle: string;
  currentIndex: number;
  totalCount: number;
  answer: string;
  isWrong: boolean;
  submitting: boolean;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>{stepTitle}</Text>
        <Text style={styles.navCounter}>{currentIndex + 1}/{totalCount}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.questionsContainer}>
        <View style={[styles.questionCard, isWrong && styles.questionCardWrong]}>
          <Text style={styles.questionText}>{question.questionText}</Text>
          <TextInput
            style={[styles.questionInput, isWrong && styles.questionInputWrong]}
            value={answer}
            onChangeText={onChange}
            placeholder="Ta réponse"
            placeholderTextColor={colors.textMuted}
            editable={!submitting}
          />
          {isWrong && (
            <Text style={styles.questionError}>Cette réponse est incorrecte</Text>
          )}
        </View>
      </ScrollView>
      <View style={styles.dialogueFooter}>
        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={onNext}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? 'VÉRIFICATION...' : '➡  VALIDER'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TreasureView({ coords, code, onCodeChange, validating, onValidate, onBack }: {
  coords: { latitude: number; longitude: number } | null;
  code: string;
  onCodeChange: (c: string) => void;
  validating: boolean;
  onValidate: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>LE TRÉSOR</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.centered}>
        <Text style={styles.phaseEmoji}>🏆</Text>
        <Text style={styles.phaseTitle}>TU AS DÉBLOQUÉ LE TRÉSOR !</Text>
        <Text style={styles.phaseDesc}>
          Les coordonnées du trésor ont été calculées. Rends-toi à cet endroit pour trouver le code.
        </Text>

        {coords && (
          <View style={styles.coordsBox}>
            <Text style={styles.coordsLabel}>LATITUDE</Text>
            <Text style={styles.coordsValue}>{coords.latitude.toFixed(6)}°</Text>
            <Text style={styles.coordsLabel}>LONGITUDE</Text>
            <Text style={styles.coordsValue}>{coords.longitude.toFixed(6)}°</Text>
          </View>
        )}

        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>CODE TROUVÉ SUR PLACE</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Ex: ABCD1234"
            placeholderTextColor={colors.textLight}
            value={code}
            onChangeText={onCodeChange}
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onValidate}
            disabled={validating || code.length < 4}
          >
            {validating
              ? <ActivityIndicator color={colors.textWhite} />
              : <Text style={styles.primaryButtonText}>🔓  VALIDER LE CODE</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompletedView({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={[styles.safe, styles.completedSafe]}>
      <ScrollView contentContainerStyle={styles.centered}>
        <Text style={{ fontSize: 80 }}>🎉</Text>
        <Text style={styles.completedTitle}>BRAVO !</Text>
        <Text style={styles.completedText}>
          Tu as découvert le trésor et terminé cette chasse avec succès !
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
          <Text style={styles.primaryButtonText}>← RETOUR AU PARCOURS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  completedSafe: { backgroundColor: colors.primary },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBack: { fontSize: 22, color: colors.primary, fontWeight: font.bold, width: 40 },
  navTitle: { fontSize: 15, fontWeight: font.bold, color: colors.text, letterSpacing: 0.5, flex: 1, textAlign: 'center' },
  navCounter: { fontSize: 13, color: colors.textLight, width: 40, textAlign: 'right' },

  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  phaseEmoji: { fontSize: 64, marginBottom: spacing.md },
  phaseTitle: { fontSize: 20, fontWeight: font.bold, color: colors.text, textAlign: 'center', textTransform: 'uppercase', marginBottom: spacing.md },
  phaseDesc: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },

  distanceBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  distanceText: { color: colors.text, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 240,
  },
  primaryButtonText: { color: colors.textWhite, fontWeight: font.bold, fontSize: 15, letterSpacing: 0.5 },

  navButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: font.semibold,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  // Dialogues
  dialogueContainer: { flexGrow: 1, padding: spacing.lg },
  dialogueLine: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  dialogueAvatar: { width: 48, height: 48, borderRadius: radius.full, marginRight: spacing.md, resizeMode: 'cover' },
  dialogueAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dialogueBubble: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  dialogueSpeaker: { fontSize: 12, fontWeight: font.bold, color: colors.primary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  dialogueText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  dialogueFooter: { backgroundColor: colors.card, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },

  // Questions
  questionsContainer: { padding: spacing.md, gap: spacing.md },
  questionsSubtitle: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: spacing.sm },
  questionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  questionCardWrong: { borderColor: colors.error },
  questionNumber: { fontSize: 11, fontWeight: font.bold, color: colors.textLight, letterSpacing: 0.5, marginBottom: spacing.xs },
  questionText: { fontSize: 15, fontWeight: font.semibold, color: colors.text, marginBottom: spacing.sm, lineHeight: 20 },
  answerInput: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  answerInputWrong: { borderColor: colors.error, backgroundColor: '#FFF5F5' },
  explanation: { fontSize: 13, color: colors.accent, marginTop: spacing.sm, fontStyle: 'italic' },

  // Trésor
  coordsBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xl, width: '100%', borderWidth: 1, borderColor: colors.border },
  coordsLabel: { fontSize: 11, fontWeight: font.bold, color: colors.textLight, letterSpacing: 1 },
  coordsValue: { fontSize: 20, fontWeight: font.bold, color: colors.primary, marginBottom: spacing.sm },
  codeSection: { width: '100%', gap: spacing.md },
  codeLabel: { fontSize: 13, fontWeight: font.bold, color: colors.text, letterSpacing: 0.5, textAlign: 'center' },
  codeInput: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, fontSize: 22, fontWeight: font.bold, color: colors.text, textAlign: 'center', borderWidth: 1, borderColor: colors.border, letterSpacing: 4 },

  // Terminé
  completedTitle: { fontSize: 28, fontWeight: font.bold, color: colors.textWhite, textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.md },
  completedText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
});
