import express from 'express';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import facultyRouter from './routes/faculty.js';
import healthRouter from './routes/health.js';
import locationsRouter from './routes/locations.js';
import studentsRouter from './routes/students.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const app = express();

app.use(express.json());
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(readFileSync(join(publicDir, 'index.html'), 'utf-8'));
});

app.use('/api/students', studentsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/health', healthRouter);
app.use('/api/faculty', facultyRouter);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message });
});

export default app;
