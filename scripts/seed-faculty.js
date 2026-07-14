import pool from '../src/db.js';

import { faculty } from '../database/seeds/faculty.js';
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const f of faculty) {
      const result = await client.query(
        `INSERT INTO faculty (name, slug, title, department, species, hook, background, motivation, fear, demeanor, strength, weakness,
          courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits, location_slug)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name, title=EXCLUDED.title, department=EXCLUDED.department, species=EXCLUDED.species,
           hook=EXCLUDED.hook, background=EXCLUDED.background, motivation=EXCLUDED.motivation,
           fear=EXCLUDED.fear, demeanor=EXCLUDED.demeanor, strength=EXCLUDED.strength, weakness=EXCLUDED.weakness,
           courage=EXCLUDED.courage, wit=EXCLUDED.wit, heart=EXCLUDED.heart, discipline=EXCLUDED.discipline,
           arcana=EXCLUDED.arcana, perception=EXCLUDED.perception, resilience=EXCLUDED.resilience, cunning=EXCLUDED.cunning,
           traits=EXCLUDED.traits, location_slug=EXCLUDED.location_slug
         RETURNING id, name`,
        [f.name, f.slug, f.title, f.department, f.species, f.hook, f.background, f.motivation, f.fear, f.demeanor, f.strength, f.weakness,
         f.courage, f.wit, f.heart, f.discipline, f.arcana, f.perception, f.resilience, f.cunning,
         JSON.stringify(f.traits), f.location_slug]
      );
      if (result.rows.length > 0) {
        console.log(`  ✅ ${result.rows[0].name} (${f.title})`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Seeded ${faculty.length} faculty.`);
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