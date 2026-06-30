import pool from '../src/db.js';

const nameFilter = process.argv[2];

async function viewStudents() {
  try {
    if (nameFilter) {
      // View single student by name (case-insensitive partial match)
      const result = await pool.query(
        `SELECT * FROM students WHERE LOWER(name) LIKE LOWER($1) ORDER BY id`,
        [`%${nameFilter}%`]
      );
      if (result.rows.length === 0) {
        console.log(`No student matching "${nameFilter}"`);
      }
      for (const s of result.rows) {
        printStudent(s);
      }
    } else {
      // List all
      const result = await pool.query('SELECT * FROM students ORDER BY id');
      if (result.rows.length === 0) {
        console.log('No students yet. Run `npm run add` to add one.');
      }
      console.log(`\n📚 ${result.rows.length} student(s)\n`);
      for (const s of result.rows) {
        printCompact(s);
      }
    }
  } catch (err) {
    console.error('❌ Query failed:', err.message);
  } finally {
    await pool.end();
  }
}

function printCompact(s) {
  const statsStr = ['courage','wit','heart','discipline','arcana','perception','resilience','cunning']
    .map(st => `${st[0].toUpperCase()}:${s[st] ?? '-'}`).join(' ');
  console.log(`  [${s.id}] ${s.name} — ${s.year}`);
  console.log(`      ${statsStr}`);
  console.log(`      ${s.hook.slice(0, 100)}...`);
  console.log();
}

function printStudent(s) {
  console.log(`\n━━━ ${s.name} (#${s.id}) — ${s.year} ━━━\n`);
  console.log(`Hook: ${s.hook}\n`);
  console.log(`Background: ${s.background}\n`);
  console.log(`Motivation: ${s.motivation}`);
  console.log(`Fear:       ${s.fear}`);
  console.log(`Demeanor:   ${s.demeanor}\n`);

  console.log('Stats:');
  const stats = ['courage','wit','heart','discipline','arcana','perception','resilience','cunning'];
  const bar = (n) => '█'.repeat(n) + '░'.repeat(10 - n);
  for (const st of stats) {
    const val = s[st] ?? 0;
    console.log(`  ${st.padEnd(12)} ${bar(val)} ${val}/10`);
  }

  console.log(`\nStrength: ${s.strength}`);
  console.log(`Weakness: ${s.weakness}\n`);

  if (s.traits && s.traits.length > 0) {
    console.log('Traits:');
    for (const t of s.traits) {
      console.log(`  • ${t.name}: ${t.effect}`);
    }
    console.log();
  }

  console.log(`Created: ${s.created_at}`);
}

viewStudents();