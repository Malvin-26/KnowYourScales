import { Router } from 'express';
import { z } from 'zod';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addXp, grantAchievement, logActivity, updateStreak } from '../services/progress.js';

const router = Router();

router.post('/submit', authMiddleware, async (req: AuthRequest, res) => {
  const schema = z.object({
    exerciseType: z.string(),
    difficulty: z.string(),
    score: z.number(),
    totalQuestions: z.number(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid ear training data' });
    return;
  }
  const { exerciseType, difficulty, score, totalQuestions } = parsed.data;
  const userId = req.user!.userId;

  await sql`
    INSERT INTO ear_training_results (user_id, exercise_type, difficulty, score, total_questions)
    VALUES (${userId}, ${exerciseType}, ${difficulty}, ${score}, ${totalQuestions})
  `;

  const xp = Math.round((score / totalQuestions) * 40) + 15;
  const xpResult = await addXp(userId, xp);
  await updateStreak(userId);
  await logActivity(userId, 'ear_training', 0, { exerciseType, difficulty, score, totalQuestions });

  const counts = await sql`
    SELECT COUNT(*) as c FROM ear_training_results WHERE user_id = ${userId}
  `;
  const count = counts[0] as { c: string | number };
  if (Number(count.c) >= 5) await grantAchievement(userId, 'ear-beginner');

  res.json({ success: true, xpEarned: xp, ...xpResult });
});

export default router;
