import { Router } from 'express';
import { z } from 'zod';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  addXp,
  addDailyPracticeMinutes,
  ensureDailyMinutesCurrent,
  ensureProgress,
  grantAchievement,
  logActivity,
  updateStreak,
  xpForNextLevel,
  checkLevelAchievements,
} from '../services/progress.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  await ensureProgress(userId);
  await ensureDailyMinutesCurrent(userId);
  const progressRows = await sql`SELECT * FROM user_progress WHERE user_id = ${userId}`;
  const progress = progressRows[0];
  const achievements = await sql`
    SELECT a.*, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ${userId}
    ORDER BY ua.earned_at DESC
  `;

  const recentActivity = await sql`
    SELECT activity_type, metadata, duration_seconds, created_at
    FROM activity_log WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 10
  `;

  const quizStats = await sql`
    SELECT quiz_type, AVG(CAST(score AS REAL) / total_questions) as avg_score, COUNT(*) as count
    FROM quiz_results WHERE user_id = ${userId}
    GROUP BY quiz_type
  `;

  const p = progress as { xp: number; level: number };
  res.json({
    progress: {
      ...progress,
      xpForNextLevel: xpForNextLevel(p.level),
      xpInCurrentLevel: p.xp % 500,
    },
    achievements,
    recentActivity,
    quizStats,
  });
});

const activitySchema = z.object({
  activityType: z.string(),
  durationSeconds: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  xpEarned: z.number().optional(),
});

router.post('/activity', async (req: AuthRequest, res) => {
  const parsed = activitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid activity data' });
    return;
  }
  const userId = req.user!.userId;
  const { activityType, durationSeconds = 0, metadata, xpEarned = 10 } = parsed.data;

  await logActivity(userId, activityType, durationSeconds, metadata);
  await addDailyPracticeMinutes(userId, durationSeconds);
  await updateStreak(userId);

  const fieldMap: Record<string, string> = {
    scale_explore: 'scales_explored',
    quiz: 'quizzes_completed',
    ear_training: 'ear_sessions_completed',
    chord: 'chords_practiced',
    song: 'songs_practiced',
    lesson: 'lessons_completed',
  };
  const field = fieldMap[activityType];
  if (field) {
    await sql`UPDATE user_progress SET ${sql(field)} = ${sql(field)} + 1 WHERE user_id = ${userId}`;
  }

  const result = await addXp(userId, xpEarned);
  await checkLevelAchievements(userId, result.level);

  if (activityType === 'scale_explore') {
    const rows = await sql`SELECT scales_explored FROM user_progress WHERE user_id = ${userId}`;
    const row = rows[0] as { scales_explored: number } | undefined;
    if (row && row.scales_explored >= 1) await grantAchievement(userId, 'first-scale');
    if (row && row.scales_explored >= 12) await grantAchievement(userId, 'scale-master');
  }
  if (activityType === 'quiz') await grantAchievement(userId, 'quiz-rookie');
  if (activityType === 'chord') {
    const rows = await sql`SELECT chords_practiced FROM user_progress WHERE user_id = ${userId}`;
    const row = rows[0] as { chords_practiced: number } | undefined;
    if (row && row.chords_practiced >= 5) await grantAchievement(userId, 'chord-explorer');
  }

  res.json({ success: true, ...result });
});

router.patch('/daily-goal', async (req: AuthRequest, res) => {
  const { minutes } = req.body;
  if (typeof minutes !== 'number' || minutes < 5 || minutes > 120) {
    res.status(400).json({ error: 'Goal must be between 5 and 120 minutes' });
    return;
  }
  await sql`UPDATE user_progress SET daily_goal_minutes = ${minutes} WHERE user_id = ${req.user!.userId}`;
  res.json({ success: true });
});

router.get('/recommendations', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  await ensureProgress(userId);
  const progressRows = await sql`SELECT * FROM user_progress WHERE user_id = ${userId}`;
  const progress = progressRows[0] as {
    scales_explored: number;
    quizzes_completed: number;
    ear_sessions_completed: number;
    practice_streak: number;
  };

  const recommendations: Array<{ type: string; title: string; description: string; path: string }> = [];

  if (progress.scales_explored < 5) {
    recommendations.push({
      type: 'scale',
      title: 'Explore Major Scales',
      description: 'Start with C major and work around the circle of fifths',
      path: '/scales',
    });
  }
  if (progress.quizzes_completed < 3) {
    recommendations.push({
      type: 'quiz',
      title: 'Take a Scale Quiz',
      description: 'Test your knowledge with an easy identification quiz',
      path: '/quiz',
    });
  }
  if (progress.ear_sessions_completed < 2) {
    recommendations.push({
      type: 'ear',
      title: 'Ear Training Warm-up',
      description: 'Practice identifying intervals by ear',
      path: '/ear-training',
    });
  }
  if (progress.practice_streak === 0) {
    recommendations.push({
      type: 'practice',
      title: 'Start Your Streak',
      description: 'Complete 15 minutes of practice today',
      path: '/dashboard',
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'chord',
      title: 'Chord Progressions',
      description: 'Practice ii–V–I in different keys',
      path: '/chords',
    });
  }

  res.json({ recommendations });
});

export default router;
