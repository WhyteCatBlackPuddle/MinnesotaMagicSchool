import pool from '../src/db.js';

import { locations } from '../database/seeds/locations.js';
await pool.query('DELETE FROM locations');

for (const l of locations) {
  await pool.query(
    'INSERT INTO locations (slug, name, category, icon, teaser, description, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [l.slug, l.name, l.category, l.icon, l.teaser, l.description, l.sort]
  );
}

const count = await pool.query('SELECT count(*) FROM locations');
console.log('Seeded ' + count.rows[0].count + ' locations');
await pool.end();