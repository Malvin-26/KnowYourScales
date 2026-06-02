import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db/database.js';
import { signToken, authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ensureProgress } from '../services/progress.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid registration data' });
    return;
  }
  const { email, username, password, displayName } = parsed.data;

  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).get(email, username);
  if (existing) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (email, username, password_hash, display_name)
    VALUES (?, ?, ?, ?)
  `).run(email, username, hash, displayName || username);

  const userId = Number(result.lastInsertRowid);
  ensureProgress(userId);

  const token = signToken({ userId, email });
  res.status(201).json({
    token,
    user: { id: userId, email, username, displayName: displayName || username },
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }
  const { email, password } = parsed.data;

  const user = db.prepare(
    'SELECT id, email, username, password_hash, display_name FROM users WHERE email = ?'
  ).get(email) as
    | { id: number; email: string; username: string; password_hash: string; display_name: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
    },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT id, email, username, display_name, avatar_url, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
