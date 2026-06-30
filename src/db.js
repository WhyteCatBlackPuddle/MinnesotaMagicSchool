import pg from 'pg';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env') });
if (!process.env.DATABASE_URL && existsSync(join(projectRoot, 'db', '.env'))) {
  dotenv.config({ path: join(projectRoot, 'db', '.env') });
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/magic_school',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

export default pool;