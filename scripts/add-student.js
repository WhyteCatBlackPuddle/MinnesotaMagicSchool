import readline from 'readline';
import pool from '../src/db.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

const STATS = ['courage', 'wit', 'heart', 'discipline', 'arcana', 'perception', 'resilience', 'cunning'];
const FIELDS = ['name', 'year', 'hook', 'background', 'motivation', 'fear', 'demeanor', 'strength', 'weakness'];

async function addStudent() {
  console.log('\n🧙 Adding a new student — press Enter to skip optional fields\n');
  console.log('— Required fields —\n');

  const student = {};

  for (const field of FIELDS) {
    const val = await ask(`${field}: `);
    if (val.trim()) student[field] = val.trim();
  }

  // Stats
  console.log('\n— Stats (1–10, press Enter to skip) —\n');
  for (const stat of STATS) {
    const val = await ask(`${stat}: `);
    if (val.trim()) {
      const n = parseInt(val, 10);
      if (n >= 1 && n <= 10) student[stat] = n;
      else console.log(`  ⚠️  Ignored — must be 1–10`);
    }
  }

  // Traits
  console.log('\n— Traits (name: "effect", one per line, blank line to finish) —\n');
  const traits = [];
  while (true) {
    const line = await ask('  trait: ');
    if (!line.trim()) break;
    const colon = line.indexOf(':');
    if (colon > 0) {
      const name = line.slice(0, colon).trim();
      const effect = line.slice(colon + 1).trim();
      traits.push({ name, effect });
    } else {
      console.log('  ⚠️  Format: "Trait Name: Effect description"');
    }
  }
  student.traits = traits;

  // Confirm
  console.log('\n--- Preview ---');
  console.log(JSON.stringify(student, null, 2));
  const confirm = await ask('\nSave? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    rl.close();
    await pool.end();
    return;
  }

  // Validate required
  for (const field of FIELDS) {
    if (!student[field]) {
      console.error(`❌ Missing required field: ${field}`);
      rl.close();
      await pool.end();
      return;
    }
  }

  // Insert
  try {
    const result = await pool.query(
      `INSERT INTO students (name, year, hook, background, motivation, fear, demeanor, strength, weakness,
        courage, wit, heart, discipline, arcana, perception, resilience, cunning, traits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, name`,
      [
        student.name, student.year, student.hook, student.background,
        student.motivation, student.fear, student.demeanor, student.strength, student.weakness,
        student.courage || null, student.wit || null, student.heart || null,
        student.discipline || null, student.arcana || null, student.perception || null,
        student.resilience || null, student.cunning || null,
        JSON.stringify(student.traits),
      ]
    );
    console.log(`\n✅ Saved! ${result.rows[0].name} (id: ${result.rows[0].id})`);
  } catch (err) {
    console.error('❌ Save failed:', err.message);
  }

  rl.close();
  await pool.end();
}

addStudent();