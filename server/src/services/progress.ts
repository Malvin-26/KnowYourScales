import sql from '../db/database.js';

const XP_PER_LEVEL = 500;

export function xpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

export async function ensureProgress(userId: number): Promise<void> {
  const exists = await sql`SELECT user_id FROM user_progress WHERE user_id = ${userId}`;
  if (exists.length === 0) {
    await sql`INSERT INTO user_progress (user_id) VALUES (${userId})`;
  }
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Reset today's minute counter when the calendar day has changed since last practice. */
export async function ensureDailyMinutesCurrent(userId: number): Promise<void> {
  await ensureProgress(userId);
  const today = todayDateString();
  const rows = await sql`
    SELECT last_practice_date, daily_minutes_today FROM user_progress WHERE user_id = ${userId}
  `;
  const row = rows[0] as { last_practice_date: string | null; daily_minutes_today: number } | undefined;

  if (row && row.last_practice_date !== today && row.daily_minutes_today !== 0) {
    await sql`UPDATE user_progress SET daily_minutes_today = 0 WHERE user_id = ${userId}`;
  }
}

/** Add practice minutes for today; resets the daily counter when the date rolls over. */
export async function addDailyPracticeMinutes(userId: number, durationSeconds: number): Promise<void> {
  await ensureProgress(userId);
  const today = todayDateString();
  const minutes = Math.ceil(durationSeconds / 60);
  if (minutes <= 0) return;
  const rows = await sql`
    SELECT last_practice_date, daily_minutes_today FROM user_progress WHERE user_id = ${userId}
  `;
  const row = rows[0] as { last_practice_date: string | null; daily_minutes_today: number } | undefined;

  if (row) {
    if (row.last_practice_date !== today) {
      await sql`
        UPDATE user_progress
        SET daily_minutes_today = ${minutes}, total_practice_minutes = total_practice_minutes + ${minutes}
        WHERE user_id = ${userId}
      `;
    } else {
      await sql`
        UPDATE user_progress
        SET daily_minutes_today = daily_minutes_today + ${minutes},
            total_practice_minutes = total_practice_minutes + ${minutes}
        WHERE user_id = ${userId}
      `;
    }
  }
}

export async function addXp(userId: number, amount: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  await ensureProgress(userId);
  const rows = await sql`SELECT xp, level FROM user_progress WHERE user_id = ${userId}`;
  const row = rows[0] as { xp: number; level: number };

  const newXp = row.xp + amount;
  const newLevel = xpToLevel(newXp);
  const leveledUp = newLevel > row.level;
  await sql`UPDATE user_progress SET xp = ${newXp}, level = ${newLevel} WHERE user_id = ${userId}`;
  return { xp: newXp, level: newLevel, leveledUp };
}

export async function updateStreak(userId: number): Promise<void> {
  await ensureProgress(userId);
  const today = todayDateString();
  const rows = await sql`
    SELECT practice_streak, longest_streak, last_practice_date FROM user_progress WHERE user_id = ${userId}
  `;
  const row = rows[0] as {
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
  } else {
    streak = 1;
  }

  const longest = Math.max(streak, row.longest_streak);
  await sql`
    UPDATE user_progress
    SET practice_streak = ${streak}, longest_streak = ${longest}, last_practice_date = ${today}
    WHERE user_id = ${userId}
  `;

  if (streak >= 3) await grantAchievement(userId, 'streak-3');
  if (streak >= 7) await grantAchievement(userId, 'streak-7');
}

export async function grantAchievement(userId: number, achievementId: string): Promise<boolean> {
  const exists = await sql`
    SELECT 1 FROM user_achievements WHERE user_id = ${userId} AND achievement_id = ${achievementId}
  `;
  if (exists.length > 0) return false;

  const achs = await sql`SELECT xp_reward FROM achievements WHERE id = ${achievementId}`;
  const ach = achs[0] as { xp_reward: number } | undefined;
  if (!ach) return false;

  await sql`
    INSERT INTO user_achievements (user_id, achievement_id) VALUES (${userId}, ${achievementId})
  `;
  await addXp(userId, ach.xp_reward);
  return true;
}

export async function checkLevelAchievements(userId: number, level: number): Promise<void> {
  if (level >= 5) await grantAchievement(userId, 'level-5');
  if (level >= 10) await grantAchievement(userId, 'level-10');
}

export async function logActivity(
  userId: number,
  activityType: string,
  durationSeconds = 0,
  metadata?: Record<string, unknown>
): Promise<void> {
  await sql`
    INSERT INTO activity_log (user_id, activity_type, metadata, duration_seconds)
    VALUES (${userId}, ${activityType}, ${metadata ? JSON.stringify(metadata) : null}, ${durationSeconds})
  `;
}
