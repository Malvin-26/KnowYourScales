import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
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

router.get('/', (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  ensureProgress(userId);
  ensureDailyMinutesCurrent(userId);
  const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId);
  const achievements = db.prepare(`
    SELECT a.*, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC
  `).all(userId);

  const recentActivity = db.prepare(`
    SELECT activity_type, metadata, duration_seconds, created_at
    FROM activity_log WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(userId);

  const quizStats = db.prepare(`
    SELECT quiz_type, AVG(CAST(score AS REAL) / total_questions) as avg_score, COUNT(*) as count
    FROM quiz_results WHERE user_id = ?
    GROUP BY quiz_type
  `).all(userId);

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

router.post('/activity', (req: AuthRequest, res) => {
  const parsed = activitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid activity data' });
    return;
  }
  const userId = req.user!.userId;
  const { activityType, durationSeconds = 0, metadata, xpEarned = 10 } = parsed.data;

  logActivity(userId, activityType, durationSeconds, metadata);
  addDailyPracticeMinutes(userId, durationSeconds);
  updateStreak(userId);

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
    db.prepare(`UPDATE user_progress SET ${field} = ${field} + 1 WHERE user_id = ?`).run(userId);
  }

  const result = addXp(userId, xpEarned);
  checkLevelAchievements(userId, result.level);

  if (activityType === 'scale_explore') {
    const row = db.prepare('SELECT scales_explored FROM user_progress WHERE user_id = ?').get(userId) as {
      scales_explored: number;
    };
    if (row.scales_explored >= 1) grantAchievement(userId, 'first-scale');
    if (row.scales_explored >= 12) grantAchievement(userId, 'scale-master');
  }
  if (activityType === 'quiz') grantAchievement(userId, 'quiz-rookie');
  if (activityType === 'chord') {
    const row = db.prepare('SELECT chords_practiced FROM user_progress WHERE user_id = ?').get(userId) as {
      chords_practiced: number;
    };
    if (row.chords_practiced >= 5) grantAchievement(userId, 'chord-explorer');
  }

  res.json({ success: true, ...result });
});

router.patch('/daily-goal', (req: AuthRequest, res) => {
  const { minutes } = req.body;
  if (typeof minutes !== 'number' || minutes < 5 || minutes > 120) {
    res.status(400).json({ error: 'Goal must be between 5 and 120 minutes' });
    return;
  }
  db.prepare('UPDATE user_progress SET daily_goal_minutes = ? WHERE user_id = ?').run(
    minutes,
    req.user!.userId
  );
  res.json({ success: true });
});

router.get('/recommendations', (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(userId) as {
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
