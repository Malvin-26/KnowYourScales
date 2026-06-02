import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addXp, logActivity, updateStreak } from '../services/progress.js';

const router = Router();

router.get('/', (req, res) => {
  const { scale, difficulty } = req.query;
  let query = 'SELECT * FROM songs WHERE 1=1';
  const params: string[] = [];
  if (scale) {
    query += ' AND scale_key LIKE ?';
    params.push(`%${scale}%`);
  }
  if (difficulty) {
    query += ' AND difficulty = ?';
    params.push(difficulty as string);
  }
  query += ' ORDER BY difficulty, title';

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    title: string;
    artist: string;
    scale_key: string;
    difficulty: string;
    tempo: number;
    progression: string;
    chords: string;
    category: string;
  }>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      scaleKey: r.scale_key,
      difficulty: r.difficulty,
      tempo: r.tempo,
      progression: r.progression,
      chords: JSON.parse(r.chords),
      category: r.category,
    }))
  );
});

router.post('/practice', authMiddleware, (req: AuthRequest, res) => {
  const { songId, durationSeconds = 120 } = req.body;
  const userId = req.user!.userId;
  logActivity(userId, 'song', durationSeconds, { songId });
  updateStreak(userId);
  const result = addXp(userId, 20);
  res.json({ success: true, ...result });
});

export default router;
