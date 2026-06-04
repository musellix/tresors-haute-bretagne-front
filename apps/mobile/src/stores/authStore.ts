import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, setTokenProvider } from '@tresors/shared';
import type { UserDTO, LoginRequest, RegisterRequest } from '@tresors/shared';

const ACCESS_KEY = 'tresors_access';
const REFRESH_KEY = 'tresors_refresh';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  setTokenProvider(() => get().accessToken);

  return {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_KEY);
        if (token) {
          const user = await authApi.me();
          set({ user, accessToken: token, isInitialized: true });
        } else {
          set({ isInitialized: true });
        }
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
        set({ isInitialized: true });
      }
    },

    login: async (data) => {
      set({ isLoading: true });
      try {
        const res = await authApi.login(data);
        await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
        await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
        set({ user: res.user, accessToken: res.accessToken, isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    register: async (data) => {
      set({ isLoading: true });
      try {
        await authApi.register(data);
        set({ isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    logout: async () => {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
      await SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
      set({ user: null, accessToken: null });
    },
  };
});
