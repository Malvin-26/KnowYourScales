import { Router } from 'express';
import { z } from 'zod';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  addXp,
  addDailyPracticeMinutes,
  grantAchievement,
  logActivity,
  updateStreak,
} from '../services/progress.js';

const router = Router();

router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  const results = await sql`
    SELECT * FROM quiz_results WHERE user_id = ${req.user!.userId}
    ORDER BY completed_at DESC LIMIT 20
  `;
  res.json({ results });
});

const submitSchema = z.object({
  quizType: z.string(),
  difficulty: z.string(),
  score: z.number(),
  totalQuestions: z.number(),
  timeSeconds: z.number().optional(),
});

router.post('/submit', authMiddleware, async (req: AuthRequest, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid quiz data' });
    return;
  }
  const { quizType, difficulty, score, totalQuestions, timeSeconds } = parsed.data;
  const userId = req.user!.userId;

  await sql`
    INSERT INTO quiz_results (user_id, quiz_type, difficulty, score, total_questions, time_seconds)
    VALUES (${userId}, ${quizType}, ${difficulty}, ${score}, ${totalQuestions}, ${timeSeconds ?? null})
  `;

  const xp = Math.round((score / totalQuestions) * 50) + 10;
  const xpResult = await addXp(userId, xp);
  const duration = timeSeconds ?? 0;
  await logActivity(userId, 'quiz', duration, { quizType, difficulty, score, totalQuestions });
  await addDailyPracticeMinutes(userId, duration > 0 ? duration : 60);
  await updateStreak(userId);
  await sql`UPDATE user_progress SET quizzes_completed = quizzes_completed + 1 WHERE user_id = ${userId}`;

  await grantAchievement(userId, 'quiz-rookie');
  if (score === totalQuestions) await grantAchievement(userId, 'perfect-quiz');

  res.json({ success: true, xpEarned: xp, ...xpResult });
});

export default router;
