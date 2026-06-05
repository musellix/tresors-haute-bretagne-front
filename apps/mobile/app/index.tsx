import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/theme';

export default function Index() {
  const { isInitialized, user, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, user]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={colors.textWhite} size="large" />
    </View>
  );
}
