import axios from 'axios';
import type {
  AuthResponse, LoginRequest, RegisterRequest,
  KorriganDTO, ThemeDTO, TreasureHuntDTO, StepDTO,
  DialogueDTO, QuestionDTO, UserProgressDTO,
  SubmitAnswersRequest, SubmitAnswersResult,
  HintDTO, ProximityCheckResult, TreasureCoordinatesDTO,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let _getToken: (() => string | null) | null = null;

export function setTokenProvider(fn: () => string | null) {
  _getToken = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = _getToken?.();
  console.log('[API]', config.method?.toUpperCase(), config.url, 'token:', token ? 'present' : 'MISSING');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then(r => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<void>('/auth/register', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }).then(r => r.data),

  me: () =>
    apiClient.get('/auth/me').then(r => r.data),
};

// ── Korrigans ─────────────────────────────────────────────────────────────────

export const korriganApi = {
  getAll: () =>
    apiClient.get<KorriganDTO[]>('/korrigans').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<KorriganDTO>(`/korrigans/${id}`).then(r => r.data),
};

// ── Thèmes ────────────────────────────────────────────────────────────────────

export const themeApi = {
  getAll: () =>
    apiClient.get<ThemeDTO[]>('/themes').then(r => r.data),
};

// ── Chasses ───────────────────────────────────────────────────────────────────

export const huntApi = {
  getAll: () =>
    apiClient.get<TreasureHuntDTO[]>('/treasure-hunts').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<TreasureHuntDTO>(`/treasure-hunts/${id}`).then(r => r.data),

  getByTheme: (themeId: number) =>
    apiClient.get<TreasureHuntDTO[]>(`/treasure-hunts/by-theme/${themeId}`).then(r => r.data),

  getSteps: (huntId: number) =>
    apiClient.get<StepDTO[]>(`/treasure-hunts/${huntId}/steps`).then(r => r.data),

  getStep: (huntId: number, stepId: number) =>
    apiClient.get<StepDTO>(`/treasure-hunts/${huntId}/steps/${stepId}`).then(r => r.data),
};

// ── Progression joueur ────────────────────────────────────────────────────────

export const progressApi = {
  start: (huntId: number) =>
    apiClient.post<UserProgressDTO>(`/user-progress/${huntId}/start`).then(r => r.data),

  getAll: () =>
    apiClient.get<UserProgressDTO[]>('/user-progress').then(r => r.data),

  get: (huntId: number) =>
    apiClient.get<UserProgressDTO>(`/user-progress/${huntId}`).then(r => r.data),

  checkProximity: (huntId: number, stepId: number, latitude: number, longitude: number) =>
    apiClient.post<ProximityCheckResult>(`/user-progress/${huntId}/steps/${stepId}/check-proximity`, {
      latitude, longitude,
    }).then(r => r.data),

  submitAnswers: (huntId: number, stepId: number, data: SubmitAnswersRequest) =>
    apiClient.post<SubmitAnswersResult>(`/user-progress/${huntId}/steps/${stepId}/submit-answers`, data).then(r => r.data),

  getHint: (huntId: number, stepId: number) =>
    apiClient.get<HintDTO>(`/user-progress/${huntId}/steps/${stepId}/hint`).then(r => r.data),

  getTreasureCoordinates: (huntId: number) =>
    apiClient.get<TreasureCoordinatesDTO>(`/user-progress/${huntId}/treasure-coordinates`).then(r => r.data),

  validateCode: (huntId: number, code: string) =>
    apiClient.post<void>(`/user-progress/${huntId}/validate-code`, { code }).then(r => r.data),
};
