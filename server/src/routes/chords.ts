import { Router } from 'express';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addXp, logActivity, updateStreak } from '../services/progress.js';

const router = Router();

router.get('/', async (_req, res) => {
  const rows = await sql`SELECT * FROM chord_progressions ORDER BY genre, name` as Array<{
    id: string;
    name: string;
    genre: string;
    key_example: string;
    numerals: string;
    chords: string;
    description: string;
  }>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      genre: r.genre,
      keyExample: r.key_example,
      numerals: r.numerals,
      chords: JSON.parse(r.chords),
      description: r.description,
    }))
  );
});

router.post('/practice', authMiddleware, async (req: AuthRequest, res) => {
  const { progressionId, durationSeconds = 60 } = req.body;
  const userId = req.user!.userId;
  await logActivity(userId, 'chord', durationSeconds, { progressionId });
  await updateStreak(userId);
  const result = await addXp(userId, 15);
  res.json({ success: true, ...result });
});

export default router;
