import db from '../db/database.js';

const XP_PER_LEVEL = 500;

export function xpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export function ensureProgress(userId: number): void {
  const exists = db.prepare('SELECT user_id FROM user_progress WHERE user_id = ?').get(userId);
  if (!exists) {
    db.prepare('INSERT INTO user_progress (user_id) VALUES (?)').run(userId);
  }
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Reset today's minute counter when the calendar day has changed since last practice. */
export function ensureDailyMinutesCurrent(userId: number): void {
  ensureProgress(userId);
  const today = todayDateString();
  const row = db.prepare(
    'SELECT last_practice_date, daily_minutes_today FROM user_progress WHERE user_id = ?'
  ).get(userId) as { last_practice_date: string | null; daily_minutes_today: number };

  if (row.last_practice_date !== today && row.daily_minutes_today !== 0) {
    db.prepare('UPDATE user_progress SET daily_minutes_today = 0 WHERE user_id = ?').run(userId);
  }
}

/** Add practice minutes for today; resets the daily counter when the date rolls over. */
export function addDailyPracticeMinutes(userId: number, durationSeconds: number): void {
  ensureProgress(userId);
  const today = todayDateString();
  const minutes = Math.ceil(durationSeconds / 60);
  if (minutes <= 0) return;
  const row = db.prepare(
    'SELECT last_practice_date, daily_minutes_today FROM user_progress WHERE user_id = ?'
  ).get(userId) as { last_practice_date: string | null; daily_minutes_today: number };

  if (row.last_practice_date !== today) {
    db.prepare(`
      UPDATE user_progress
      SET daily_minutes_today = ?, total_practice_minutes = total_practice_minutes + ?
      WHERE user_id = ?
    `).run(minutes, minutes, userId);
  } else {
    db.prepare(`
      UPDATE user_progress
      SET daily_minutes_today = daily_minutes_today + ?,
          total_practice_minutes = total_practice_minutes + ?
      WHERE user_id = ?
    `).run(minutes, minutes, userId);
  }
}

export function addXp(userId: number, amount: number): { xp: number; level: number; leveledUp: boolean } {
  ensureProgress(userId);
  const row = db.prepare('SELECT xp, level FROM user_progress WHERE user_id = ?').get(userId) as {
    xp: number;
    level: number;
  };
  const newXp = row.xp + amount;
  const newLevel = xpToLevel(newXp);
  const leveledUp = newLevel > row.level;
  db.prepare('UPDATE user_progress SET xp = ?, level = ? WHERE user_id = ?').run(newXp, newLevel, userId);
  return { xp: newXp, level: newLevel, leveledUp };
}

export function updateStreak(userId: number): void {
  ensureProgress(userId);
  const today = todayDateString();
  const row = db.prepare(
    'SELECT practice_streak, longest_streak, last_practice_date FROM user_progress WHERE user_id = ?'
  ).get(userId) as {
    practice_streak: number;
    longest_streak: number;
    last_practice_date: string | null;
  };

  let streak = row.practice_streak;
  if (row.last_practice_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (row.last_practice_date === yesterdayStr) {
    streak += 1;
  } else if (row.last_practice_date !== today) {
    streak = 1;
  }

  const longest = Math.max(streak, row.longest_streak);
  db.prepare(`
    UPDATE user_progress
    SET practice_streak = ?, longest_streak = ?, last_practice_date = ?
    WHERE user_id = ?
  `).run(streak, longest, today, userId);

  if (streak >= 3) grantAchievement(userId, 'streak-3');
  if (streak >= 7) grantAchievement(userId, 'streak-7');
}

export function grantAchievement(userId: number, achievementId: string): boolean {
  const exists = db.prepare(
    'SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
  ).get(userId, achievementId);
  if (exists) return false;

  const ach = db.prepare('SELECT xp_reward FROM achievements WHERE id = ?').get(achievementId) as
    | { xp_reward: number }
    | undefined;
  if (!ach) return false;

  db.prepare(
    'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)'
  ).run(userId, achievementId);
  addXp(userId, ach.xp_reward);
  return true;
}

export function checkLevelAchievements(userId: number, level: number): void {
  if (level >= 5) grantAchievement(userId, 'level-5');
  if (level >= 10) grantAchievement(userId, 'level-10');
}

export function logActivity(
  userId: number,
  activityType: string,
  durationSeconds = 0,
  metadata?: Record<string, unknown>
): void {
  db.prepare(`
    INSERT INTO activity_log (user_id, activity_type, metadata, duration_seconds)
    VALUES (?, ?, ?, ?)
  `).run(userId, activityType, metadata ? JSON.stringify(metadata) : null, durationSeconds);
}
