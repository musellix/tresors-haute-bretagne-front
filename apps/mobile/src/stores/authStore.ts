import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, setTokenProvider } from '@tresors/shared';
import type { UserDTO, LoginRequest, RegisterRequest } from '@tresors/shared';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (token) {
        set({ accessToken: token, refreshToken: refresh });
        setTokenProvider(() => get().accessToken);
        const user = await authApi.me();
        set({ user, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isInitialized: true, accessToken: null, refreshToken: null });
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(data);
      await SecureStore.setItemAsync('accessToken', res.accessToken);
      await SecureStore.setItemAsync('refreshToken', res.refreshToken);
      set({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
      setTokenProvider(() => get().accessToken);
    } catch (e: any) {
      // Network error (server unreachable)
      if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network Error') || !e?.response) {
        const msg = 'Impossible de contacter le serveur. Vérifie ta connexion internet ou réessaie plus tard.';
        set({ error: msg });
        throw new Error(msg);
      }
      // Server error (401, 400, etc.)
      const msg = e?.response?.data?.error ?? 'Email ou mot de passe incorrect';
      set({ error: msg });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);
    } catch (e: any) {
      // Network error (server unreachable)
      if (e?.code === 'ERR_NETWORK' || e?.message?.includes('Network Error') || !e?.response) {
        const msg = 'Impossible de contacter le serveur. Vérifie ta connexion internet ou réessaie plus tard.';
        set({ error: msg });
        throw new Error(msg);
      }
      // Server error (400, etc.)
      const msg = e?.response?.data?.error ?? "Erreur lors de l'inscription";
      set({ error: msg });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  clearError: () => set({ error: null }),
}));
