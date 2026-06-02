import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addXp, logActivity, updateStreak } from '../services/progress.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM chord_progressions ORDER BY genre, name').all() as Array<{
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

router.post('/practice', authMiddleware, (req: AuthRequest, res) => {
  const { progressionId, durationSeconds = 60 } = req.body;
  const userId = req.user!.userId;
  logActivity(userId, 'chord', durationSeconds, { progressionId });
  updateStreak(userId);
  const result = addXp(userId, 15);
  res.json({ success: true, ...result });
});

export default router;
