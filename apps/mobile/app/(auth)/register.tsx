import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing, radius, font } from '../../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    try {
      await register({ name, email: email.trim().toLowerCase(), password });
      Alert.alert(
        'Compte créé !',
        'Un email de vérification t\'a été envoyé. Vérifie ta boîte mail avant de te connecter.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      console.error('Register error:', JSON.stringify(err?.response?.data), err?.message, err?.code);
      const msg = err?.response?.data?.error ?? err?.message ?? 'Une erreur est survenue.';
      Alert.alert('Inscription impossible', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>CRÉER UN COMPTE</Text>
          <Text style={styles.subtitle}>Rejoins l'aventure !</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Ton prénom ou pseudo"
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (8 caractères min.)"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={colors.textWhite} />
              : <Text style={styles.buttonText}>CRÉER MON COMPTE</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  back: {
    marginBottom: spacing.xl,
  },
  backText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: font.semibold,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: font.bold,
    color: colors.textWhite,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.textWhite,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.textWhite,
    fontWeight: font.bold,
    fontSize: 16,
    letterSpacing: 1,
  },
});
