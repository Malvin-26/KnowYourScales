-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- User progress & gamification
CREATE TABLE IF NOT EXISTS user_progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  practice_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date TEXT,
  daily_goal_minutes INTEGER DEFAULT 15,
  daily_minutes_today INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  scales_explored INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  ear_sessions_completed INTEGER DEFAULT 0,
  chords_practiced INTEGER DEFAULT 0,
  songs_practiced INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0
);

-- Quiz / session scores
CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_seconds INTEGER,
  completed_at TEXT DEFAULT (datetime('now'))
);

-- Ear training sessions
CREATE TABLE IF NOT EXISTS ear_training_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TEXT DEFAULT (datetime('now'))
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

-- Saved favorites / bookmarks
CREATE TABLE IF NOT EXISTS user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, item_type, item_key)
);

-- Practice activity log (for stats & recommendations)
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Reference: scales (seeded)
CREATE TABLE IF NOT EXISTS scales (
  id TEXT PRIMARY KEY,
  root TEXT NOT NULL,
  type TEXT NOT NULL,
  notes TEXT NOT NULL,
  formula TEXT NOT NULL,
  relative_key TEXT
);

-- Reference: chord progressions (seeded)
CREATE TABLE IF NOT EXISTS chord_progressions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT NOT NULL,
  key_example TEXT NOT NULL,
  numerals TEXT NOT NULL,
  chords TEXT NOT NULL,
  description TEXT
);

-- Reference: songs (seeded)
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  scale_key TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  tempo INTEGER NOT NULL,
  progression TEXT NOT NULL,
  chords TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Lesson completions
CREATE TABLE IF NOT EXISTS user_lesson_completions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
