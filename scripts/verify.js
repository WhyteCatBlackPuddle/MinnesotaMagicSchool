import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = process.cwd();
const port = process.env.VERIFY_PORT || String(3500 + Math.floor(Math.random() * 1000));
const requiredFiles = [
  'api/index.js',
  'database/schema.sql',
  'package.json',
  'public/index.html',
  'src/db.js',
  'src/server.js',
  'vercel.json',
];
const checks = [];

function pass(message) {
  checks.push(message);
  console.log(`✓ ${message}`);
}

function fail(message) {
  throw new Error(message);
}

async function collectJsFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJsFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(path);
    }
  }
  return files;
}

async function fetchText(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  const text = await response.text();
  return { response, text };
}

function runNodeCheck(file) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    fail(`node --check failed for ${relative(root, file)}\n${result.stdout}\n${result.stderr}`);
  }
}

async function waitForServer(proc) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      fail(`server exited early with ${proc.exitCode}`);
    }
    try {
      const { response } = await fetchText('/');
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  fail(`server did not become ready on port ${port}`);
}

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(`missing required file: ${file}`);
}
pass(`required files exist (${requiredFiles.length})`);

for (const file of await collectJsFiles(join(root, 'api'))) runNodeCheck(file);
for (const file of await collectJsFiles(join(root, 'src'))) runNodeCheck(file);
for (const file of await collectJsFiles(join(root, 'scripts'))) runNodeCheck(file);
if (existsSync(join(root, 'database', 'seeds'))) {
  for (const file of await collectJsFiles(join(root, 'database', 'seeds'))) runNodeCheck(file);
}
if (existsSync(join(root, 'public', 'js'))) {
  for (const file of await collectJsFiles(join(root, 'public', 'js'))) runNodeCheck(file);
}
pass('JavaScript syntax checks pass');

process.env.VERCEL = '1';
const entry = await import('../api/index.js');
if (typeof entry.default !== 'function') fail('api/index.js default export is not an Express app');
pass('Vercel entry imports Express app without starting a listener');
delete process.env.VERCEL;

const server = spawn(process.execPath, ['src/server.js'], {
  cwd: root,
  env: { ...process.env, PORT: port },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(server);

  const rootResponse = await fetchText('/');
  if (!rootResponse.response.ok) fail(`root route returned ${rootResponse.response.status}`);
  if (!rootResponse.text.includes('<title>Boundary Waters Academy</title>')) {
    fail('root route did not serve Boundary Waters Academy HTML');
  }
  pass('root route serves the web UI');

  const html = rootResponse.text;
  const assetPaths = [
    ...[...html.matchAll(/href="(\/css\/[^"]+)"/g)].map(match => match[1]),
    ...[...html.matchAll(/src="(\/js\/[^"]+)"/g)].map(match => match[1]),
  ];
  for (const assetPath of assetPaths) {
    const asset = await fetchText(assetPath);
    if (!asset.response.ok) fail(`${assetPath} returned ${asset.response.status}`);
  }
  pass(`linked static assets are reachable (${assetPaths.length})`);

  const health = await fetchText('/api/health');
  const healthJson = JSON.parse(health.text);
  if (healthJson.status !== 'ok') fail(`health endpoint failed: ${health.text}`);
  pass(`health endpoint reaches database ${healthJson.database}`);

  const students = await fetchText('/api/students');
  const studentRows = JSON.parse(students.text);
  if (!Array.isArray(studentRows)) fail('/api/students did not return an array');
  pass(`/api/students returns ${studentRows.length} rows`);

  console.log('\nVerification complete.');
} finally {
  if (server.exitCode === null) {
    server.kill();
  }
}
