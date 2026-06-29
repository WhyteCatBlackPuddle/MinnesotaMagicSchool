import { readFileSync } from 'fs';
import pool from './db.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node bulk-add.js <students.json>');
  process.exit(1);
}

const students = JSON.parse(readFileSync(file, 'utf-8'));
if (!Array.isArray(students)) {
  console.error('Expected a JSON array of student objects.');
  process.exit(1);
}

const STATS = ['courage','wit','heart','discipline','arcana','perception','resilience','cunning'];
const FIELDS = ['name','year','hook','background','motivation','fear','demeanor','strength','weakness'];

async function bulkAdd() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let added = 0;

    for (const s of students) {
      // Validate required fields
      for (const f of FIELDS) {
        if (!s[f]) throw new Error(`Student "${s.name || '?'}" missing field: ${f}`);
      }

      const result = await client.query(
        `INSERT INTO students (name, year, hook, background, motivation, fear, demeanor, strength, weakness,
          courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT DO NOTHING
         RETURNING id, name`,
        [
          s.name, s.year, s.hook, s.background, s.motivation, s.fear, s.demeanor, s.strength, s.weakness,
          s.courage || null, s.wit || null, s.heart || null, s.discipline || null,
          s.arcana || null, s.perception || null, s.resilience || null, s.cunning || null,
          JSON.stringify(s.traits || []),
        ]
      );

      if (result.rows.length > 0) {
        console.log(`  ✅ ${result.rows[0].name} (id: ${result.rows[0].id})`);
        added++;
      } else {
        console.log(`  ⏭️  ${s.name} — skipped (already exists?)`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Added ${added} student(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

bulkAdd();