import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM scales ORDER BY root, type').all() as Array<{
    id: string;
    root: string;
    type: string;
    notes: string;
    formula: string;
    relative_key: string;
  }>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      root: r.root,
      type: r.type,
      notes: JSON.parse(r.notes),
      formula: r.formula,
      relativeKey: r.relative_key,
    }))
  );
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM scales WHERE id = ?').get(req.params.id) as
    | { id: string; root: string; type: string; notes: string; formula: string; relative_key: string }
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Scale not found' });
    return;
  }

  res.json({
    id: row.id,
    root: row.root,
    type: row.type,
    notes: JSON.parse(row.notes),
    formula: row.formula,
    relativeKey: row.relative_key,
  });
});

export default router;
