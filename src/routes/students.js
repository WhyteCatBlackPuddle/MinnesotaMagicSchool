import { Router } from 'express';
import pool from '../db.js';
import { asyncRoute } from '../lib/async-route.js';
import { STATS, STUDENT_REQUIRED_FIELDS } from '../lib/fields.js';
import { normalizeTraits, requireTextFields } from '../lib/validation.js';

const router = Router();

router.get('/', asyncRoute(async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name, year, hook, courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits FROM students ORDER BY id'
  );
  res.json(result.rows);
}));

router.get('/:id', asyncRoute(async (req, res) => {
  const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
}));

router.post('/', asyncRoute(async (req, res) => {
  const student = req.body;
  const missingField = requireTextFields(student, STUDENT_REQUIRED_FIELDS);
  if (missingField) {
    return res.status(400).json({ error: `Missing required field: ${missingField}` });
  }

  const result = await pool.query(
    `INSERT INTO students (name, year, hook, background, motivation, fear, demeanor, strength, weakness,
      courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING id, name`,
    [
      student.name.trim(), student.year, student.hook.trim(), student.background.trim(), student.motivation.trim(),
      student.fear.trim(), student.demeanor.trim(), student.strength.trim(), student.weakness.trim(),
      student.courage || null, student.wit || null, student.heart || null, student.discipline || null,
      student.arcana || null, student.perception || null, student.resilience || null, student.cunning || null,
      normalizeTraits(student.traits),
    ]
  );

  res.status(201).json(result.rows[0]);
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const student = req.body;
  const missingField = requireTextFields(student, STUDENT_REQUIRED_FIELDS);
  if (missingField) {
    return res.status(400).json({ error: `Missing required field: ${missingField}` });
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
      student.name.trim(), student.year, student.hook.trim(), student.background.trim(), student.motivation.trim(),
      student.fear.trim(), student.demeanor.trim(), student.strength.trim(), student.weakness.trim(),
      student.courage || null, student.wit || null, student.heart || null, student.discipline || null,
      student.arcana || null, student.perception || null, student.resilience || null, student.cunning || null,
      normalizeTraits(student.traits),
      req.params.id,
    ]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
}));

router.patch('/:id', asyncRoute(async (req, res) => {
  const student = req.body;
  const allowed = [...STATS, ...STUDENT_REQUIRED_FIELDS, 'traits'];
  const updates = [];
  const values = [];
  let i = 1;

  for (const field of allowed) {
    if (student[field] !== undefined) {
      if (STUDENT_REQUIRED_FIELDS.includes(field) && (!student[field] || !String(student[field]).trim())) {
        return res.status(400).json({ error: `Field ${field} cannot be empty` });
      }
      updates.push(`${field} = $${i}`);
      values.push(field === 'traits' ? normalizeTraits(student[field]) : student[field]);
      i++;
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push('updated_at = NOW()');
  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE students SET ${updates.join(', ')}
     WHERE id = $${i}
     RETURNING id, name`,
    values
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id, name', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true, ...result.rows[0] });
}));

export default router;
