import { Router } from 'express';
import db from '../db/database.js';
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

router.get('/completed', authMiddleware, (req: AuthRequest, res) => {
  const rows = db.prepare(
    'SELECT lesson_id, completed_at FROM user_lesson_completions WHERE user_id = ?'
  ).all(req.user!.userId) as Array<{ lesson_id: string; completed_at: string }>;

  res.json({
    completed: rows.map((r) => r.lesson_id),
    xpPerLesson: LESSON_XP,
  });
});

router.post('/:lessonId/complete', authMiddleware, (req: AuthRequest, res) => {
  const { lessonId } = req.params;
  if (!LESSON_IDS.includes(lessonId as (typeof LESSON_IDS)[number])) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  const userId = req.user!.userId;
  const existing = db.prepare(
    'SELECT 1 FROM user_lesson_completions WHERE user_id = ? AND lesson_id = ?'
  ).get(userId, lessonId);

  if (existing) {
    res.json({ success: true, alreadyCompleted: true, xpEarned: 0 });
    return;
  }

  db.prepare(
    'INSERT INTO user_lesson_completions (user_id, lesson_id) VALUES (?, ?)'
  ).run(userId, lessonId);

  logActivity(userId, 'lesson', 180, { lessonId });
  addDailyPracticeMinutes(userId, 180);
  updateStreak(userId);
  db.prepare(
    'UPDATE user_progress SET lessons_completed = lessons_completed + 1 WHERE user_id = ?'
  ).run(userId);
  const xpResult = addXp(userId, LESSON_XP);

  res.json({
    success: true,
    alreadyCompleted: false,
    xpEarned: LESSON_XP,
    ...xpResult,
  });
});

export default router;
