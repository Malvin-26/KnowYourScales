import { Router } from 'express';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { addXp, logActivity, updateStreak } from '../services/progress.js';

const router = Router();

router.get('/', async (req, res) => {
  const { scale, difficulty } = req.query;

  const rows = await sql`
    SELECT * FROM songs
    WHERE 1=1
    ${scale ? sql`AND scale_key LIKE ${'%' + (scale as string) + '%'}` : sql``}
    ${difficulty ? sql`AND difficulty = ${difficulty as string}` : sql``}
    ORDER BY difficulty, title
  ` as Array<{
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

router.post('/practice', authMiddleware, async (req: AuthRequest, res) => {
  const { songId, durationSeconds = 120 } = req.body;
  const userId = req.user!.userId;
  await logActivity(userId, 'song', durationSeconds, { songId });
  await updateStreak(userId);
  const result = await addXp(userId, 20);
  res.json({ success: true, ...result });
});

export default router;
