import { Router } from 'express';
import sql from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const all = await sql`SELECT * FROM achievements ORDER BY category, name`;
  res.json({ achievements: all });
});

router.get('/mine', authMiddleware, async (req: AuthRequest, res) => {
  const earned = await sql`
    SELECT a.*, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = ${req.user!.userId}
  `;

  const all = await sql`SELECT * FROM achievements`;
  res.json({ earned, all, total: all.length, earnedCount: earned.length });
});

export default router;
