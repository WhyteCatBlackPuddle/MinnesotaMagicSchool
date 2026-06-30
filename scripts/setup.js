import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  const client = await pool.connect();
  try {
    // Create database if it doesn't exist (connect to postgres first)
    const schema = readFileSync(join(__dirname, '..', 'database', 'schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();