import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/authStore';

export default function RootLayout() {
  const { isInitialized, user, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const inAuth = segments[0] === '(auth)';
    const inIndex = !segments[0] || segments[0] === 'index';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && (inAuth || inIndex)) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, user, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="hunt/[id]" />
        <Stack.Screen name="hunt/[id]/play" />
      </Stack>
    </SafeAreaProvider>
  );
}
