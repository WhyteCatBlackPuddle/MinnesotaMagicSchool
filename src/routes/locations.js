import { Router } from 'express';
import pool from '../db.js';
import { asyncRoute } from '../lib/async-route.js';

const router = Router();

router.get('/', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    'SELECT id, slug, name, category, icon, teaser, description FROM locations ORDER BY sort_order, id'
  );
  res.json(result.rows);
}));

router.get('/:slug', asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT * FROM locations WHERE slug = $1', [req.params.slug]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
}));

export default router;
