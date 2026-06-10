import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { huntApi, progressApi } from '@tresors/shared';
import type { StepDTO, DialogueDTO, QuestionDTO, UserProgressDTO, StepContentItemDTO } from '@tresors/shared';
import { colors, spacing, radius, font } from '../../../src/theme';
import { getKorriganAssets } from '../../../src/korrigans';

type Phase = 'loading' | 'map' | 'content' | 'treasure' | 'completed';

// Toutes les étapes commencent par la carte (localisation requise)
function stepPhase(_step: StepDTO): 'map' | 'content' {
  return 'map';
}

// ── Leaflet / OSM HTML ─────────────────────────────────────────────────────────

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #e5e3df; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map, destMarker, destCircle, userMarker, didFitBoth = false;

  function initMap() {
    map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19
    }).addTo(map);
    map.setView([48.2, -1.7], 10);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
  }

  function setDestination(lat, lon, title, radius) {
    if (destCircle) map.removeLayer(destCircle);
    if (destMarker) map.removeLayer(destMarker);
    didFitBoth = false;
    destCircle = L.circle([lat, lon], {
      radius: radius, color: '#c0392b', fillColor: '#e74c3c', fillOpacity: 0.12, weight: 2
    }).addTo(map);
    var icon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:#c0392b;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
      iconSize: [28, 28], iconAnchor: [14, 28], className: ''
    });
    destMarker = L.marker([lat, lon], { icon: icon }).addTo(map);
    destMarker.bindPopup('<b>' + title + '</b>').openPopup();
    if (!userMarker) { map.setView([lat, lon], 16); }
    else { fitBoth(); }
  }

  function setUserLocation(lat, lon) {
    if (!userMarker) {
      var icon = L.divIcon({
        html: '<div style="width:14px;height:14px;background:#2980b9;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7], className: ''
      });
      userMarker = L.marker([lat, lon], { icon: icon }).addTo(map);
      userMarker.bindPopup('Vous êtes ici');
      if (destMarker) fitBoth();
    } else {
      userMarker.setLatLng([lat, lon]);
      if (!didFitBoth && destMarker) fitBoth();
    }
  }

  function fitBoth() {
    if (destMarker && userMarker) {
      var bounds = L.latLngBounds([destMarker.getLatLng(), userMarker.getLatLng()]);
      map.fitBounds(bounds, { padding: [60, 60] });
      didFitBoth = true;
    }
  }

  window.handleRNMessage = function(jsonStr) {
    try {
      var msg = JSON.parse(jsonStr);
      if (msg.type === 'destination') setDestination(msg.lat, msg.lon, msg.title, msg.radius);
      if (msg.type === 'userLocation') setUserLocation(msg.lat, msg.lon);
    } catch(e) {}
  };
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onload="initMap()"></script>
</body>
</html>`;

// ── Écran principal ────────────────────────────────────────────────────────────

export default function PlayScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const huntId = Number(id);

  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState<UserProgressDTO | null>(null);
  const [step, setStep] = useState<StepDTO | null>(null);
  const [steps, setSteps] = useState<StepDTO[]>([]);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [treasureCoords, setTreasureCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [code, setCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const allSteps = await huntApi.getSteps(huntId);
      let prog = await progressApi.get(huntId);

      if (prog.isCompleted) { setPhase('completed'); return; }
      if (prog.isTreasureUnlocked) {
        await loadTreasureCoords();
        setPhase('treasure');
        return;
      }

      const currentStep = allSteps.find(s => s.stepOrder === prog.currentStep);
      if (!currentStep) { setPhase('loading'); return; }

      setProgress(prog);
      setSteps(allSteps);
      setStep(currentStep);
      setPhase('map');
    } catch (e: any) {
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

  // ── Navigation entre étapes ────────────────────────────────────────────────

  const handlePrevStep = () => {
    if (!step || step.stepOrder <= 1) return;
    const prevStep = steps.find(s => s.stepOrder === step.stepOrder - 1);
    if (prevStep) {
      setStep(prevStep);
      setAnswers({});
      setWrongIds([]);
      setPhase(stepPhase(prevStep));
    }
  };

  // ── Soumission de toutes les réponses d'une étape ─────────────────────────

  const handleSubmitContent = async () => {
    if (!step) return;
    const questions = step.content?.filter(c => c.type === 'question' && c.question) ?? [];

    if (questions.length === 0) {
      setSubmitting(true);
      try {
        await progressApi.submitAnswers(huntId, step.id, { answers: [] });
        await handleContentComplete();
      } catch {
        Alert.alert('Erreur', 'Impossible de continuer.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const unanswered = questions.filter(c => !(answers[c.question!.id] ?? '').trim());
    if (unanswered.length > 0) {
      Alert.alert('Énigmes sans réponse', 'Réponds à toutes les énigmes avant de continuer !');
      return;
    }

    setSubmitting(true);
    setWrongIds([]);
    try {
      // Soumettre les réponses (sauvegarde sans bloquer — vérification uniquement à La Cache)
      await progressApi.submitAnswers(huntId, step.id, {
        answers: questions.map(c => ({ questionId: c.question!.id, answer: answers[c.question!.id] ?? '' })),
      });
      await handleContentComplete();
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre les réponses.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentComplete = async () => {
    const updated = await progressApi.get(huntId);
    setProgress(updated);
    if (updated.isTreasureUnlocked) {
      await loadTreasureCoords();
      setPhase('treasure');
    } else {
      const next = steps.find(s => s.stepOrder === updated.currentStep);
      if (next && next.id !== step?.id) {
        setStep(next);
        setAnswers({});
        setWrongIds([]);
        setPhase(stepPhase(next));
      } else {
        // Bloqué à la dernière étape : certaines réponses du parcours sont fausses
        const lastQStep = [...steps].reverse().find(s => s.content?.some(c => c.type === 'question'));
        Alert.alert('Réponses incorrectes', 'Certaines de tes réponses sont fausses. Corrige-les pour accéder à La Cache !');
        if (lastQStep) {
          setStep(lastQStep);
          setAnswers({});
          setWrongIds([]);
          setPhase('content');
        }
      }
    }
  };

  // ── Validation code final ──────────────────────────────────────────────────

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

  // ── Rendus ─────────────────────────────────────────────────────────────────

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

  if (phase === 'map') {
    return (
      <MapPhaseView
        step={step!}
        progress={progress!}
        onNext={() => setPhase('content')}
        onPrev={handlePrevStep}
        onBack={() => router.back()}
      />
    );
  }

  if (phase === 'content') {
    return (
      <ContentView
        step={step!}
        answers={answers}
        wrongIds={wrongIds}
        submitting={submitting}
        onAnswerChange={(qId, val) => setAnswers(a => ({ ...a, [qId]: val }))}
        onSubmit={handleSubmitContent}
        onBack={() => setPhase('map')}
      />
    );
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

// ── MapPhaseView ───────────────────────────────────────────────────────────────

function MapPhaseView({ step, progress, onNext, onPrev, onBack }: {
  step: StepDTO;
  progress: UserProgressDTO;
  onNext: () => void;
  onPrev: () => void;
  onBack: () => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !active) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
        (l) => { if (active) setUserLocation({ lat: l.coords.latitude, lon: l.coords.longitude }); },
      );
    })();
    return () => {
      active = false;
      locationSubRef.current?.remove();
    };
  }, []);

  const inject = useCallback((data: object) => {
    const json = JSON.stringify(JSON.stringify(data));
    webViewRef.current?.injectJavaScript(`window.handleRNMessage(${json}); true;`);
  }, []);

  // Envoyer la destination quand la carte est prête ou que l'étape change
  useEffect(() => {
    if (mapReady) {
      inject({ type: 'destination', lat: step.latitude, lon: step.longitude, title: step.title, radius: step.radiusMeters });
    }
  }, [step, mapReady, inject]);

  // Mettre à jour la position utilisateur dès qu'elle change
  useEffect(() => {
    if (mapReady && userLocation) {
      inject({ type: 'userLocation', lat: userLocation.lat, lon: userLocation.lon });
    }
  }, [userLocation, mapReady, inject]);

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    if (event.nativeEvent.data === 'ready') setMapReady(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>{step.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <WebView
        ref={webViewRef}
        style={{ flex: 1 }}
        source={{ html: MAP_HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={handleWebViewMessage}
      />

      <View style={styles.mapFooter}>
        {step.stepOrder > 1 ? (
          <TouchableOpacity style={[styles.mapBtn, styles.mapBtnSecondary]} onPress={onPrev}>
            <Text style={styles.mapBtnSecondaryText}>← Précédent</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <TouchableOpacity style={[styles.mapBtn, styles.mapBtnPrimary]} onPress={onNext}>
          <Text style={styles.mapBtnPrimaryText}>Suivant →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── buildDisplayItems ──────────────────────────────────────────────────────────
// Fusionne le dialogue juste avant une question dans la carte question.

type DisplayItem =
  | { kind: 'info'; text: string; idx: number }
  | { kind: 'dialogue'; dialogue: DialogueDTO; idx: number }
  | { kind: 'question'; question: QuestionDTO; intro?: DialogueDTO; idx: number };

function buildDisplayItems(content: StepContentItemDTO[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  let skipNext = false;
  const filtered = content;
  for (let i = 0; i < filtered.length; i++) {
    if (skipNext) { skipNext = false; continue; }
    const item = filtered[i];
    const next = filtered[i + 1];
    if (item.type === 'dialogue' && item.dialogue) {
      if (!item.dialogue.korrigan) {
        items.push({ kind: 'info', text: item.dialogue.text, idx: i });
      } else if (next?.type === 'question' && next.question) {
        items.push({ kind: 'question', question: next.question, intro: item.dialogue, idx: i });
        skipNext = true;
      } else {
        items.push({ kind: 'dialogue', dialogue: item.dialogue, idx: i });
      }
    } else if (item.type === 'question' && item.question) {
      items.push({ kind: 'question', question: item.question, idx: i });
    }
  }
  return items;
}

// ── ContentView ────────────────────────────────────────────────────────────────
// Affiche tout le contenu d'une étape (dialogues + questions) en un seul scroll.

function ContentView({ step, answers, wrongIds, submitting, onAnswerChange, onSubmit, onBack }: {
  step: StepDTO;
  answers: Record<number, string>;
  wrongIds: number[];
  submitting: boolean;
  onAnswerChange: (questionId: number, val: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const displayItems = buildDisplayItems(step.content ?? []);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navBack}>←</Text></TouchableOpacity>
        <Text style={styles.navTitle}>{step.title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contentScrollContainer}>
        {displayItems.map((di) => {
          if (di.kind === 'info') {
            return (
              <View key={di.idx} style={styles.infoBox}>
                <Text style={styles.infoBoxIcon}>ℹ</Text>
                <Text style={styles.infoBoxText}>{di.text}</Text>
              </View>
            );
          }
          if (di.kind === 'dialogue') {
            const k = di.dialogue.korrigan;
            const ka = getKorriganAssets(k?.name);
            return (
              <View key={di.idx} style={styles.dialogueLine}>
                {ka ? (
                  <Image source={ka.image} style={styles.dialogueAvatar} />
                ) : (
                  <View style={[styles.dialogueAvatar, styles.dialogueAvatarFallback]}>
                    <Text style={{ fontSize: 22 }}>🧙</Text>
                  </View>
                )}
                <View style={styles.dialogueBubble}>
                  <Text style={[styles.dialogueSpeaker, ka && { color: ka.color }]}>{k?.name ?? 'Korrigan'}</Text>
                  <Text style={styles.dialogueText}>{di.dialogue.text}</Text>
                </View>
              </View>
            );
          }
          if (di.kind === 'question') {
            const isWrong = wrongIds.includes(di.question.id);
            if (di.intro) {
              const k = di.intro.korrigan;
              const ka = getKorriganAssets(k?.name);
              return (
                <View key={di.idx} style={styles.dialogueLine}>
                  {ka ? (
                    <Image source={ka.image} style={styles.dialogueAvatar} />
                  ) : (
                    <View style={[styles.dialogueAvatar, styles.dialogueAvatarFallback]}>
                      <Text style={{ fontSize: 22 }}>🧙</Text>
                    </View>
                  )}
                  <View style={[styles.dialogueBubble, isWrong && { borderColor: colors.error }]}>
                    <Text style={[styles.dialogueSpeaker, ka && { color: ka.color }]}>{k?.name ?? 'Korrigan'}</Text>
                    <Text style={styles.dialogueText}>{di.intro.text}</Text>
                    <View style={styles.questionDivider} />
                    <Text style={styles.questionText}>{di.question.questionText}</Text>
                    <TextInput
                      style={[styles.answerInput, isWrong && styles.answerInputWrong]}
                      value={answers[di.question.id] ?? ''}
                      onChangeText={(val) => onAnswerChange(di.question.id, val)}
                      placeholder="Ta réponse"
                      placeholderTextColor={colors.textLight}
                      editable={!submitting}
                    />
                    {isWrong && <Text style={styles.explanation}>Réponse incorrecte</Text>}
                  </View>
                </View>
              );
            }
            return (
              <View key={di.idx} style={[styles.questionCard, isWrong && styles.questionCardWrong]}>
                <Text style={styles.questionLabel}>❓ ÉNIGME</Text>
                <Text style={styles.questionText}>{di.question.questionText}</Text>
                <TextInput
                  style={[styles.answerInput, isWrong && styles.answerInputWrong]}
                  value={answers[di.question.id] ?? ''}
                  onChangeText={(val) => onAnswerChange(di.question.id, val)}
                  placeholder="Ta réponse"
                  placeholderTextColor={colors.textLight}
                  editable={!submitting}
                />
                {isWrong && <Text style={styles.explanation}>Réponse incorrecte</Text>}
              </View>
            );
          }
          return null;
        })}
        <View style={styles.contentCta}>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'VÉRIFICATION...' : '➡  CONTINUER'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── TreasureView ───────────────────────────────────────────────────────────────

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
            style={[styles.primaryButton, (validating || code.length < 4) && styles.buttonDisabled]}
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

// ── CompletedView ──────────────────────────────────────────────────────────────

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

// ── Styles ─────────────────────────────────────────────────────────────────────

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

  // Map footer
  mapFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  mapBtnPrimary: {
    backgroundColor: colors.primary,
  },
  mapBtnPrimaryText: {
    color: colors.textWhite,
    fontWeight: font.bold,
    fontSize: 15,
  },
  mapBtnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBtnSecondaryText: {
    color: colors.text,
    fontWeight: font.semibold,
    fontSize: 14,
  },

  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  phaseEmoji: { fontSize: 64, marginBottom: spacing.md },
  phaseTitle: { fontSize: 20, fontWeight: font.bold, color: colors.text, textAlign: 'center', textTransform: 'uppercase', marginBottom: spacing.md },
  phaseDesc: { fontSize: 14, color: colors.textLight, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 240,
  },
  primaryButtonText: { color: colors.textWhite, fontWeight: font.bold, fontSize: 15, letterSpacing: 0.5 },
  buttonDisabled: { opacity: 0.4 },

  // Content (dialogues + questions en scroll)
  contentScrollContainer: { padding: spacing.lg, gap: spacing.md },
  contentCta: { paddingTop: spacing.md },

  // Encart info (dialogue sans korrigan)
  infoBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoBoxIcon: { fontSize: 15, color: '#92400E', marginTop: 1 },
  infoBoxText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 19, fontStyle: 'italic' },

  // Dialogues
  dialogueLine: { flexDirection: 'row', alignItems: 'flex-start' },
  dialogueAvatar: { width: 48, height: 48, borderRadius: radius.full, marginRight: spacing.md, resizeMode: 'cover' },
  dialogueAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dialogueBubble: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  dialogueSpeaker: { fontSize: 12, fontWeight: font.bold, color: colors.primary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  dialogueText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  questionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  // Questions
  questionCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  questionLabel: { fontSize: 11, fontWeight: font.bold, color: colors.accent, letterSpacing: 1, marginBottom: spacing.sm },
  questionCardWrong: { borderColor: colors.error },
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
