import pool from './db.js';

const students = [
  {
    name: 'Oliver Hopewin',
    year: 'first-year',
    hook: "Oliver enters the school with a family crest emblazoned on his clothes. He carries the burden of his family name, aged and well established in the magic community. He has a burden to fulfill to keep the magic community safe, and a secret to keep about their future. Can he honor his family or will he be crushed under the burden of responsibility?",
    background: "Oliver comes from a rich suburb in Minnesota — old money, palatial homes, the kind of family whose name opens doors. The Hopewins are old magic, not European aristocracy but something that grew up alongside the Great Lakes shipping fortunes. Born into magic, trained since childhood.",
    motivation: "Prove himself — not just as a Hopewin, but as Oliver.",
    fear: "Becoming like his parents. Whatever they are, it's not something he admires.",
    demeanor: "Oliver is a natural leader who hasn't found his footing yet. People are drawn to him — he has that gravity — but he doesn't yet know how to wield it. He's often found climbing high places or doing handstands when he should be sitting still.",
    strength: "Athletic, physically confident, the kind of presence that makes people turn their heads when he walks into a room. Also: climbing, acrobatics, restless physical energy.",
    weakness: "Abrasive and controlling without knowing it. He thinks he's being decisive; everyone else thinks he's steamrolling them. He cannot hear himself.",
    courage: 7, wit: 5, heart: 6, discipline: 7,
    arcana: 8, perception: 4, resilience: 6, cunning: 5,
    traits: [
      { name: "Burden of the Name", effect: "Advantage on Discipline rolls when reputation is at stake; disadvantage on Heart rolls requiring genuine vulnerability." },
      { name: "Unformed Leader", effect: "People naturally look to him in group situations (+1 to social group rolls), but he hasn't learned to listen yet." },
      { name: "Restless Energy", effect: "Bonus on physical Courage challenges — climbing, acrobatics, anything that involves moving his body." }
    ]
  },
  {
    name: 'Tempest Cloudfairy',
    year: 'first-year',
    hook: "Tempest comes to the school completely unconnected, and completely gifted. Her talent and comely beauty (unknown to her) draw unwanted attention she is not prepared for. Can she find connection or will she be disconnected from others for all four years?",
    background: "Lakeville, Minnesota — middle-class family, not born into magic. Her power surfaced violently and unexpectedly in a middle-school hallway, sending another kid to the nurse. That's how she was discovered and brought to the school. She arrived knowing no one and nothing about the magical world.",
    motivation: "To belong somewhere. Anywhere. She's never had it.",
    fear: "Her own magic. It surfaced by accident and someone got hurt. She's terrified it'll happen again.",
    demeanor: "Both quiet and loud without knowing the difference. People find her a little odd — funny in a way they can't quite parse. Her tone of voice gets constantly misinterpreted: sarcastic when she's sincere, cold when she's curious, angry when she's scared. She has to work to make friends and often fails.",
    strength: "Drawing — her sketchbook is how she processes the world. Also a quiet, unflashy resilience.",
    weakness: "Her voice. She can't hear how she sounds, so she can't fix it. Every social interaction is a game of telephone where she's the only one who doesn't know the message got garbled.",
    courage: 5, wit: 6, heart: 4, discipline: 4,
    arcana: 9, perception: 7, resilience: 7, cunning: 4,
    traits: [
      { name: "Untamed Power", effect: "Advantage on Arcana rolls; on a failure, something else happens — a surge, a side effect, something unintended." },
      { name: "Odd Duck", effect: "Disadvantage on casual Heart rolls. But the few who push past the oddness find someone fiercely loyal." },
      { name: "Artist's Eye", effect: "Advantage on Perception rolls involving visual details and observation." }
    ]
  },
  {
    name: 'Kira Inkwell',
    year: 'first-year',
    hook: "Kira comes to the school with one goal in mind: Overcome. She is an awful student. Her family sacrificed to get here. She is stubborn and used to pushing herself past her limits. Can she manage to learn?",
    background: "A poor magical family from Minneapolis. Born into magic but never had the resources — no tutors, no old books, no connections. Her family scraped and sacrificed everything to get her one shot at this school.",
    motivation: "Learn to heal her family's wounds and misfortune. Magic isn't a career path — it's medicine.",
    fear: "Being seen as poor. Being pitied.",
    demeanor: "A quiet follower, but warm. People feel comfortable around her without her trying — she has a steady, grounding presence. She runs the forest trails at dawn because it's the only thing she's fully confident in.",
    strength: "Physical endurance — running, hiking, carrying weight for miles. And a warmth that makes people feel safe.",
    weakness: "She cannot accept help. She's spent her whole life proving she doesn't need it. Now she's in a place where she genuinely does, and her pride won't let her reach for it. She'll drown quietly before she'll ask for a hand.",
    courage: 8, wit: 5, heart: 8, discipline: 6,
    arcana: 3, perception: 7, resilience: 9, cunning: 4,
    traits: [
      { name: "Stubborn to the Bone", effect: "Advantage on Resilience rolls to see things through; disadvantage when she needs to change course or admit she's wrong." },
      { name: "Warm Presence", effect: "People naturally feel at ease around her. Bonus on Heart rolls involving comfort, listening, steady presence." },
      { name: "Outdoor Soul", effect: "Advantage on physical challenges in natural environments — navigation, endurance, foraging, reading weather." }
    ]
  }
];

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