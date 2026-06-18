import { Router } from 'express';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  addXp,
  addDailyPracticeMinutes,
  logActivity,
  updateStreak,
} from '../services/progress.js';

const router = Router();
const LESSON_XP = 30;

const LESSON_IDS = [
  'scales-notes-and-keys',
  'circle-of-fifths',
  'scale-degree-names',
  'music-intervals',
  'major-vs-minor',
] as const;

router.get('/completed', authMiddleware, async (req: AuthRequest, res) => {
  const rows = await sql`
    SELECT lesson_id, completed_at FROM user_lesson_completions WHERE user_id = ${req.user!.userId}
  ` as Array<{ lesson_id: string; completed_at: string }>;

  res.json({
    completed: rows.map((r) => r.lesson_id),
    xpPerLesson: LESSON_XP,
  });
});

router.post('/:lessonId/complete', authMiddleware, async (req: AuthRequest, res) => {
  const { lessonId } = req.params;
  if (!LESSON_IDS.includes(lessonId as (typeof LESSON_IDS)[number])) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  const userId = req.user!.userId;
  const existingRows = await sql`
    SELECT 1 FROM user_lesson_completions WHERE user_id = ${userId} AND lesson_id = ${lessonId}
  `;
  const existing = existingRows[0];

  if (existing) {
    res.json({ success: true, alreadyCompleted: true, xpEarned: 0 });
    return;
  }

  await sql`
    INSERT INTO user_lesson_completions (user_id, lesson_id) VALUES (${userId}, ${lessonId})
  `;

  await logActivity(userId, 'lesson', 180, { lessonId });
  await addDailyPracticeMinutes(userId, 180);
  await updateStreak(userId);
  await sql`
    UPDATE user_progress SET lessons_completed = lessons_completed + 1 WHERE user_id = ${userId}
  `;
  const xpResult = await addXp(userId, LESSON_XP);

  res.json({
    success: true,
    alreadyCompleted: false,
    xpEarned: LESSON_XP,
    ...xpResult,
  });
});

export default router;
