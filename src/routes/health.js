import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as db');
    res.json({ status: 'ok', time: result.rows[0].now, database: result.rows[0].db });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

export default router;
