#!/usr/bin/env node
import pool from '../src/db.js';

const cmd = process.argv[2];
const STATS = ['courage','wit','heart','discipline','arcana','perception','resilience','cunning'];
const FIELDS = ['name','year','hook','background','motivation','fear','demeanor','strength','weakness'];

async function main() {
  try {
    switch (cmd) {
      case 'list':    await list(); break;
      case 'show':    await show(process.argv[3]); break;
      case 'add':     await add(process.argv[3]); break;
      case 'edit':    await edit(process.argv[3], process.argv[4]); break;
      case 'delete':  await del(process.argv[3]); break;
      case 'verify':  await verify(process.argv[3]); break;
      case 'export':  await exportAll(process.argv[3]); break;
      case 'stats':   await statsOverview(); break;
      default:
        console.log('Usage: node cli.js <command> [args]');
        console.log('  list                 compact list of all students');
        console.log('  show <id|name>       full detail for one student');
        console.log('  add  \'{...json...}\'   add a student from JSON string');
        console.log('  edit <id> \'{...json}\' update fields on a student');
        console.log('  delete <id>          remove a student');
        console.log('  verify [id|name]     validate all or one student');
        console.log('  export [file]        dump all as JSON (or to file)');
        console.log('  stats                overview: counts, stat spreads');
    }
  } finally {
    await pool.end();
  }
}

// ── list ──────────────────────────────────────────────
async function list() {
  const r = await pool.query('SELECT id, name, year, courage, wit, heart, discipline, arcana, perception, resilience, cunning, hook FROM students ORDER BY id');
  console.log(`\n📚 ${r.rows.length} student(s)\n`);
  for (const s of r.rows) {
    const sum = STATS.reduce((a,k) => a + (s[k]||0), 0);
    const bars = STATS.map(k => bar(s[k]||0)).join('');
    console.log(`  [${String(s.id).padStart(2)}] ${s.name.padEnd(22)} ${s.year.padEnd(12)} ${bars} ${sum}pts`);
  }
  console.log();
}

// ── show ───────────────────────────────────────────────
async function show(arg) {
  if (!arg) { console.error('Usage: node cli.js show <id|name>'); return; }
  const isId = /^\d+$/.test(arg);
  const r = isId
    ? await pool.query('SELECT * FROM students WHERE id = $1', [arg])
    : await pool.query('SELECT * FROM students WHERE LOWER(name) LIKE LOWER($1)', [`%${arg}%`]);

  if (r.rows.length === 0) { console.log(`No match for "${arg}"`); return; }
  for (const s of r.rows) {
    const sum = STATS.reduce((a,k) => a + (s[k]||0), 0);
    console.log(`\n━━━ ${s.name} (#${s.id}) · ${s.year} ━━━`);
    console.log(`\nHook: ${s.hook}`);
    console.log(`\nBackground: ${s.background}`);
    console.log(`\nMotivation:   ${s.motivation}`);
    console.log(`Fear:          ${s.fear}`);
    console.log(`Demeanor:      ${s.demeanor}`);
    console.log(`\nStrength:  ${s.strength}`);
    console.log(`Weakness:  ${s.weakness}`);
    console.log(`\nStats (sum ${sum}):`);
    for (const k of STATS) {
      console.log(`  ${k.padEnd(12)} ${bar(s[k]||0)} ${s[k]||0}/10`);
    }
    if (s.traits && s.traits.length) {
      console.log(`\nTraits:`);
      for (const t of s.traits) console.log(`  · ${t.name}: ${t.effect}`);
    }
    console.log();
  }
}

// ── add ────────────────────────────────────────────────
async function add(jsonArg) {
  let data;
  if (jsonArg) {
    data = JSON.parse(jsonArg);
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    data = JSON.parse(Buffer.concat(chunks).toString());
  }

  const students = Array.isArray(data) ? data : [data];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of students) {
      for (const f of FIELDS) {
        if (!s[f]) throw new Error(`"${s.name||'?'}" missing field: ${f}`);
      }
      const result = await client.query(
        `INSERT INTO students (name,year,hook,background,motivation,fear,demeanor,strength,weakness,
          courage,wit,heart,discipline,arcana,perception,resilience,cunning,traits)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id,name`,
        [s.name,s.year,s.hook,s.background,s.motivation,s.fear,s.demeanor,s.strength,s.weakness,
         s.courage||null,s.wit||null,s.heart||null,s.discipline||null,
         s.arcana||null,s.perception||null,s.resilience||null,s.cunning||null,
         JSON.stringify(s.traits||[])]);
      const sum = STATS.reduce((a,k) => a + (s[k]||0), 0);
      console.log(`✅ ${result.rows[0].name} (id:${result.rows[0].id}) ${sum}pts`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
}

// ── edit ───────────────────────────────────────────────
async function edit(idArg, jsonArg) {
  if (!idArg || !jsonArg) { console.error('Usage: node cli.js edit <id> \'{...json}\''); return; }
  const patch = JSON.parse(jsonArg);
  const allowed = [...FIELDS, ...STATS, 'traits'];
  const updates = [], values = [];
  let i = 1;
  for (const f of allowed) {
    if (patch[f] !== undefined) {
      updates.push(`${f} = $${i}`);
      values.push(f === 'traits' ? JSON.stringify(patch[f]) : patch[f]);
      i++;
    }
  }
  if (!updates.length) { console.log('Nothing to update'); return; }
  values.push(idArg);
  const result = await pool.query(
    `UPDATE students SET ${updates.join(', ')}, updated_at=NOW() WHERE id=$${i} RETURNING id,name`,
    values);
  if (result.rows.length === 0) { console.log(`No student #${idArg}`); return; }
  console.log(`✅ ${result.rows[0].name} updated`);
}

// ── delete ─────────────────────────────────────────────
async function del(idArg) {
  if (!idArg) { console.error('Usage: node cli.js delete <id>'); return; }
  const result = await pool.query('DELETE FROM students WHERE id=$1 RETURNING id,name', [idArg]);
  if (result.rows.length === 0) { console.log(`No student #${idArg}`); return; }
  console.log(`🗑️  Deleted ${result.rows[0].name} (#${idArg})`);
}

// ── verify ─────────────────────────────────────────────
async function verify(arg) {
  const r = arg
    ? (await pool.query('SELECT * FROM students WHERE id=$1 OR LOWER(name) LIKE LOWER($2)',
        [arg, `%${arg}%`])).rows
    : (await pool.query('SELECT * FROM students ORDER BY id')).rows;
  if (!r.length) { console.log('No students found'); return; }

  let fails = 0;
  for (const s of r) {
    const issues = [];
    // Stats in range
    for (const k of STATS) {
      if (s[k] < 1 || s[k] > 10) issues.push(`${k}=${s[k]} (out of 1-10)`);
    }
    const sum = STATS.reduce((a,k) => a + (s[k]||0), 0);
    if (sum < 40 || sum > 55) issues.push(`sum=${sum} (expected 40-55)`);
    // Required text
    for (const f of FIELDS) {
      if (!s[f] || !s[f].trim()) issues.push(`empty ${f}`);
    }
    // Banned chars
    for (const f of FIELDS) {
      if ((s[f]||'').includes('\u2014')) issues.push(`${f} contains em dash`);
      if ((s[f]||'').includes('--')) issues.push(`${f} contains double hyphen`);
    }
    // Traits
    if (!s.traits || s.traits.length < 1) issues.push('no traits');
    for (const t of (s.traits||[])) {
      if (!t.name || !t.effect) issues.push('trait missing name/effect');
      if ((JSON.stringify(t)).includes('\u2014') || (JSON.stringify(t)).includes('--'))
        issues.push('trait contains banned chars');
    }
    // Year
    if (!['first-year','second-year','third-year','fourth-year','fifth-year','sixth-year','seventh-year','eighth-year'].includes(s.year))
      issues.push(`bad year: ${s.year}`);

    if (issues.length) {
      console.log(`❌ ${s.name} (#${s.id}): ${issues.join('; ')}`);
      fails++;
    } else {
      console.log(`✅ ${s.name} (#${s.id}) ${sum}pts`);
    }
  }
  console.log(`\n${r.length - fails}/${r.length} passed`);
  if (fails) process.exitCode = 1;
}

// ── export ─────────────────────────────────────────────
async function exportAll(fileArg) {
  const r = await pool.query('SELECT * FROM students ORDER BY id');
  const out = JSON.stringify(r.rows, null, 2);
  if (fileArg) {
    const { writeFileSync } = await import('fs');
    writeFileSync(fileArg, out, 'utf-8');
    console.log(`📄 ${r.rows.length} students → ${fileArg}`);
  } else {
    console.log(out);
  }
}

// ── stats ──────────────────────────────────────────────
async function statsOverview() {
  const r = await pool.query('SELECT * FROM students ORDER BY id');
  if (!r.rows.length) { console.log('No students.'); return; }

  const byYear = {};
  for (const s of r.rows) {
    byYear[s.year] = (byYear[s.year] || 0) + 1;
  }

  console.log(`\n📊 ${r.rows.length} students\n`);
  console.log('By year:');
  for (const [y, c] of Object.entries(byYear)) console.log(`  ${y}: ${c}`);

  console.log('\nStat averages:');
  for (const k of STATS) {
    const avg = r.rows.reduce((a,s) => a + (s[k]||0), 0) / r.rows.length;
    console.log(`  ${k.padEnd(12)} ${bar(Math.round(avg))} ${avg.toFixed(1)}`);
  }

  console.log('\nStat sum distribution:');
  const sums = r.rows.map(s => STATS.reduce((a,k) => a + (s[k]||0), 0));
  console.log(`  min: ${Math.min(...sums)}  max: ${Math.max(...sums)}  avg: ${(sums.reduce((a,b)=>a+b)/sums.length).toFixed(1)}`);
  console.log();
}

// ── helpers ────────────────────────────────────────────
function bar(n) {
  const filled = '█'.repeat(Math.max(0, n));
  const empty  = '░'.repeat(Math.max(0, 10 - n));
  return `${filled}${empty}`;
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });