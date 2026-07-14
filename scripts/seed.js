import pool from '../src/db.js';

import { students } from '../database/seeds/students.js';
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const s of students) {
      const result = await client.query(
        `INSERT INTO students (name, year, hook, background, motivation, fear, demeanor, strength, weakness,
          courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT DO NOTHING
         RETURNING id, name`,
        [s.name, s.year, s.hook, s.background, s.motivation, s.fear, s.demeanor, s.strength, s.weakness,
         s.courage, s.wit, s.heart, s.discipline, s.arcana, s.perception, s.resilience, s.cunning,
         JSON.stringify(s.traits)]
      );
      if (result.rows.length > 0) {
        console.log(`  ✅ ${result.rows[0].name} (id: ${result.rows[0].id})`);
      } else {
        console.log(`  ⏭️  ${s.name} already exists`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Seeded ${students.length} students.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();