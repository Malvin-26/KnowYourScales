import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  addXp,
  addDailyPracticeMinutes,
  grantAchievement,
  logActivity,
  updateStreak,
} from '../services/progress.js';

const router = Router();

router.get('/history', authMiddleware, (req: AuthRequest, res) => {
  const results = db.prepare(`
    SELECT * FROM quiz_results WHERE user_id = ?
    ORDER BY completed_at DESC LIMIT 20
  `).all(req.user!.userId);
  res.json({ results });
});

const submitSchema = z.object({
  quizType: z.string(),
  difficulty: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  timeSeconds: z.number().optional(),
});

router.post('/submit', authMiddleware, (req: AuthRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid quiz data' });
    return;
  }
  const { quizType, difficulty, score, totalQuestions, timeSeconds } = parsed.data;
  const userId = req.user!.userId;

  db.prepare(`
    INSERT INTO quiz_results (user_id, quiz_type, difficulty, score, total_questions, time_seconds)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, quizType, difficulty, score, totalQuestions, timeSeconds ?? null);

  const xp = Math.round((score / totalQuestions) * 50) + 10;
  const xpResult = addXp(userId, xp);
  const duration = timeSeconds ?? 0;
  logActivity(userId, 'quiz', duration, { quizType, difficulty, score, totalQuestions });
  addDailyPracticeMinutes(userId, duration > 0 ? duration : 60);
  updateStreak(userId);
  db.prepare('UPDATE user_progress SET quizzes_completed = quizzes_completed + 1 WHERE user_id = ?').run(
    userId
  );

  grantAchievement(userId, 'quiz-rookie');
  if (score === totalQuestions) grantAchievement(userId, 'perfect-quiz');

  res.json({ success: true, xpEarned: xp, ...xpResult });
});

export default router;
