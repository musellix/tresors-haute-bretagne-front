// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

// ── Korrigan & Thème ──────────────────────────────────────────────────────────

export interface KorriganDTO {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface ThemeDTO {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  korrigan?: KorriganDTO;
}

// ── Chasse au trésor ──────────────────────────────────────────────────────────

export interface TreasureHuntDTO {
  id: number;
  title: string;
  description?: string;
  theme?: ThemeDTO;
  finalLatitude?: number;
  finalLongitude?: number;
  treasureImageUrl?: string;
  isActive: boolean;
  steps?: StepDTO[];
}

export interface StepDTO {
  id: number;
  stepOrder: number;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  dialogues?: DialogueDTO[];
  questions?: QuestionDTO[];
  content?: StepContentItemDTO[]; // Unified content list (dialogues + questions ordered by contentOrder)
}

export interface DialogueDTO {
  id: number;
  dialogueOrder: number;
  contentOrder: number;
  text: string;
  audioUrl?: string;
  korrigan?: KorriganDTO;
}

export interface QuestionDTO {
  id: number;
  questionOrder: number;
  contentOrder: number;
  questionText: string;
  correctAnswer: string;
  explanation?: string;
  questionType: string;
}

export interface StepContentItemDTO {
  type: 'dialogue' | 'question';
  contentOrder: number;
  dialogue?: DialogueDTO;
  question?: QuestionDTO;
}

// ── Progression joueur ────────────────────────────────────────────────────────

export interface UserProgressDTO {
  id: number;
  userId: number;
  treasureHuntId: number;
  currentStep: number;
  isCompleted: boolean;
  isTreasureUnlocked: boolean;
  startedAt: string;
  completedAt?: string;
  firstCompletedAt?: string;
}

export interface SubmitAnswersRequest {
  answers: { questionId: number; answer: string }[];
}

export interface SubmitAnswersResult {
  allCorrect: boolean;
}

export interface HintDTO {
  wrongQuestionIds: number[];
}

export interface ProximityCheckResult {
  withinRange: boolean;
  distanceMeters: number;
  radiusMeters: number;
}

export interface TreasureCoordinatesDTO {
  latitude: number;
  longitude: number;
}
