const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function getToken(): string | null {
  return localStorage.getItem('kys_token');
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem('kys_token', token);
  else localStorage.removeItem('kys_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error ?? data.message;
    const message =
      typeof err === 'string'
        ? err
        : err && typeof err === 'object'
          ? 'Validation failed'
          : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  register: (body: { email: string; username: string; password: string; displayName?: string }) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ user: User }>('/auth/me'),

  getScales: () => request<ScaleData[]>('/scales'),
  getScale: (id: string) => request<ScaleData>(`/scales/${id}`),

  getProgress: () => request<ProgressResponse>('/progress'),
  logActivity: (body: ActivityBody) =>
    request<{ success: boolean; xp: number; level: number }>('/progress/activity', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getRecommendations: () =>
    request<{ recommendations: Recommendation[] }>('/progress/recommendations'),

  updateDailyGoal: (minutes: number) =>
    request<{ success: boolean }>('/progress/daily-goal', {
      method: 'PATCH',
      body: JSON.stringify({ minutes }),
    }),

  submitQuiz: (body: QuizSubmit) =>
    request<{ success: boolean; xpEarned: number }>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getQuizHistory: () => request<{ results: QuizResult[] }>('/quiz/history'),

  submitEar: (body: EarSubmit) =>
    request<{ success: boolean; xpEarned: number }>('/ear/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getChords: () => request<ChordProgression[]>('/chords'),
  practiceChord: (progressionId: string, durationSeconds: number) =>
    request('/chords/practice', {
      method: 'POST',
      body: JSON.stringify({ progressionId, durationSeconds }),
    }),

  getSongs: (params?: { scale?: string; difficulty?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Song[]>(`/songs${q ? `?${q}` : ''}`);
  },
  practiceSong: (songId: string, durationSeconds: number) =>
    request('/songs/practice', {
      method: 'POST',
      body: JSON.stringify({ songId, durationSeconds }),
    }),

  getLessonProgress: () =>
    request<{ completed: string[]; xpPerLesson: number }>('/lessons/completed'),
  completeLesson: (lessonId: string) =>
    request<{ success: boolean; alreadyCompleted: boolean; xpEarned: number; xp?: number; level?: number }>(
      `/lessons/${lessonId}/complete`,
      { method: 'POST' }
    ),

  getAchievements: () => request<{ achievements: Achievement[] }>('/achievements'),
  getMyAchievements: () =>
    request<{ earned: EarnedAchievement[]; all: Achievement[]; total: number; earnedCount: number }>(
      '/achievements/mine'
    ),
};

export interface User {
  id: number;
  email: string;
  username: string;
  displayName?: string;
  display_name?: string;
}

export interface ScaleData {
  id: string;
  root: string;
  type: string;
  notes: string[];
  formula: string;
  relativeKey: string;
}

export interface ProgressResponse {
  progress: UserProgress & { xpForNextLevel: number; xpInCurrentLevel: number };
  achievements: EarnedAchievement[];
  recentActivity: ActivityLog[];
  quizStats: { quiz_type: string; avg_score: number; count: number }[];
}

export interface UserProgress {
  xp: number;
  level: number;
  practice_streak: number;
  longest_streak: number;
  daily_goal_minutes: number;
  daily_minutes_today: number;
  total_practice_minutes: number;
  scales_explored: number;
  quizzes_completed: number;
  ear_sessions_completed: number;
  chords_practiced: number;
  songs_practiced: number;
}

export interface ActivityBody {
  activityType: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
  xpEarned?: number;
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  path: string;
}

export interface QuizSubmit {
  quizType: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  timeSeconds?: number;
}

export interface QuizResult {
  id: number;
  quiz_type: string;
  difficulty: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface EarSubmit {
  exerciseType: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
}

export interface ChordProgression {
  id: string;
  name: string;
  genre: string;
  keyExample: string;
  numerals: string;
  chords: string[];
  description: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  scaleKey: string;
  difficulty: string;
  tempo: number;
  progression: string;
  chords: string[];
  category: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

export interface EarnedAchievement extends Achievement {
  earned_at: string;
}

export interface ActivityLog {
  activity_type: string;
  metadata: string | null;
  duration_seconds: number;
  created_at: string;
}
