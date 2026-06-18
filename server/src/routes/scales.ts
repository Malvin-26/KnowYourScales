import { Router } from 'express';
import sql from '../db/database.js';

const router = Router();

router.get('/', async (_req, res) => {
  const rows = await sql`SELECT * FROM scales ORDER BY root, type` as Array<{
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

router.get('/:id', async (req, res) => {
  const rows = await sql`SELECT * FROM scales WHERE id = ${req.params.id}` as Array<{
    id: string;
    root: string;
    type: string;
    notes: string;
    formula: string;
    relative_key: string;
  }>;
  const row = rows[0];

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
