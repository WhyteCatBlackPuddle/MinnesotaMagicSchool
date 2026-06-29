import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());

// Serve the web UI
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(readFileSync(join(__dirname, 'index.html'), 'utf-8'));
});

// ── API ──

const STATS = ['courage','wit','heart','discipline','arcana','perception','resilience','cunning'];
const REQUIRED_FIELDS = ['name','year','hook','background','motivation','fear','demeanor','strength','weakness'];

// List all students
app.get('/api/students', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, year, hook, courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits FROM students ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one student
app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a student
app.post('/api/students', async (req, res) => {
  try {
    const s = req.body;
    for (const f of REQUIRED_FIELDS) {
      if (!s[f] || !s[f].trim()) {
        return res.status(400).json({ error: `Missing required field: ${f}` });
      }
    }

    const result = await pool.query(
      `INSERT INTO students (name, year, hook, background, motivation, fear, demeanor, strength, weakness,
        courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, name`,
      [
        s.name.trim(), s.year, s.hook.trim(), s.background.trim(), s.motivation.trim(),
        s.fear.trim(), s.demeanor.trim(), s.strength.trim(), s.weakness.trim(),
        s.courage || null, s.wit || null, s.heart || null, s.discipline || null,
        s.arcana || null, s.perception || null, s.resilience || null, s.cunning || null,
        JSON.stringify(s.traits || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a student (full replace)
app.put('/api/students/:id', async (req, res) => {
  try {
    const s = req.body;
    for (const f of REQUIRED_FIELDS) {
      if (!s[f] || !s[f].trim()) {
        return res.status(400).json({ error: `Missing required field: ${f}` });
      }
    }

    const result = await pool.query(
      `UPDATE students SET
        name=$1, year=$2, hook=$3, background=$4, motivation=$5, fear=$6,
        demeanor=$7, strength=$8, weakness=$9,
        courage=$10, wit=$11, heart=$12, discipline=$13,
        arcana=$14, perception=$15, resilience=$16, cunning=$17,
        traits=$18, updated_at=NOW()
       WHERE id=$19
       RETURNING id, name`,
      [
        s.name.trim(), s.year, s.hook.trim(), s.background.trim(), s.motivation.trim(),
        s.fear.trim(), s.demeanor.trim(), s.strength.trim(), s.weakness.trim(),
        s.courage || null, s.wit || null, s.heart || null, s.discipline || null,
        s.arcana || null, s.perception || null, s.resilience || null, s.cunning || null,
        JSON.stringify(s.traits || []),
        req.params.id,
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Partial update a student (only provided fields)
app.patch('/api/students/:id', async (req, res) => {
  try {
    const s = req.body;
    const allowed = [...REQUIRED_FIELDS, ...STATS, 'traits'];
    const updates = [];
    const values = [];
    let i = 1;

    for (const field of allowed) {
      if (s[field] !== undefined) {
        if (REQUIRED_FIELDS.includes(field) && (!s[field] || !s[field].trim())) {
          return res.status(400).json({ error: `Field ${field} cannot be empty` });
        }
        updates.push(`${field} = $${i}`);
        values.push(field === 'traits' ? JSON.stringify(s[field]) : s[field]);
        i++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE students SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING id, name`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧙 Magic School DB → http://localhost:${PORT}`);
});