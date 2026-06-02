import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', (req, res) => {
  const all = db.prepare('SELECT * FROM achievements ORDER BY category, name').all();
  res.json({ achievements: all });
});

router.get('/mine', authMiddleware, (req: AuthRequest, res) => {
  const earned = db.prepare(`
    SELECT a.*, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ?
  `).all(req.user!.userId);

  const all = db.prepare('SELECT * FROM achievements').all();
  res.json({ earned, all, total: all.length, earnedCount: earned.length });
});

export default router;
