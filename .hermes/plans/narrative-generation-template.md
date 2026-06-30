# Student Profile Narrative Template

Use this prompt with an LLM to generate traits and a character profile from raw student data.
Feed it the full JSON from `/api/students/:id` and the output goes into the `traits` array 
and a profile summary field.

---

## Prompt

```
You are writing character profiles for students at Boundary Waters Academy, a magic school 
in the northern Minnesota wilderness. The school is a castle and village on Mirror Lake, 
surrounded by old-growth pine forest. It is not a boarding-school fantasy — it is cold, 
beautiful, occasionally dangerous, and deeply human.

TONE RULES:
- Warm but not sentimental
- Whimsical but grounded in real feeling
- Real danger exists — the woods, the deep lake, isolation, each other
- Students have relatable, mundane struggles alongside magical ones
- Never grimdark, never twee. Aim for "Ghibli meets the Boundary Waters."
- Specificity > generality. A single sensory detail is worth three adjectives.

OUTPUT FORMAT (return ONLY valid JSON):

{
  "traits": [
    {
      "name": "Name of Trait",
      "effect": "One sentence mechanical effect. Pattern: 'Advantage on X when Y; disadvantage on Z.' Be creative."
    }
  ],
  "profile": "A single paragraph, 150-250 words. Third person, present tense. Capture who they are 
beyond the stats — how they move, what they're afraid of at 2 AM, what they're bad at, what 
surprises people about them. Use at least one sensory or environmental detail that places them 
at Boundary Waters Academy specifically. Do not repeat the hook verbatim. Do not list stats. 
Write like the opening paragraph of a short story."
}

TRAIT RULES:
- Generate exactly 3 traits.
- Each trait name should be evocative and specific to this character ("Restless Energy", 
  not "Good at Sports").
- Each effect should be a genuine mechanical tradeoff — bonus in one situation, 
  cost or constraint in another. No purely positive traits.
- Derive traits from: the character's highest stats (what they're naturally good at), 
  their lowest stats (what costs them), their hook, fear, and background.

PROFILE RULES:
- Read the raw data first: hook, background, motivation, fear, demeanor, strength, weakness, 
  and all 8 stats.
- Highest stats = what comes easily and what they over-rely on.
- Lowest stats = their blind spots, the source of their most interesting problems.
- The profile should feel like a person, not a D&D character sheet.
- Include at least one concrete daily-life detail: what they do at breakfast, where they sit, 
  a habit they don't notice, something they carry.
- End with a line that suggests forward motion — what they're about to learn, or what's 
  about to test them.

EXAMPLE INPUT (Oliver Hopewin, first-year):
---
Hook: Oliver enters the school with a family crest emblazoned on his clothes. He carries 
the burden of his family name, aged and well established in the magic community.
Background: Old money from a rich Minnesota suburb. The Hopewins are old magic, not European 
aristocracy but something that grew up alongside the Great Lakes shipping fortunes.
Motivation: Prove himself — not just as a Hopewin, but as Oliver.
Fear: Becoming like his parents. Whatever they are, it's not something he admires.
Demeanor: A natural leader who hasn't found his footing yet. People are drawn to him but 
he doesn't yet know how to wield it. Often found climbing high places.
Strength: Athletic, physically confident, commanding presence.
Weakness: Abrasive and controlling. He thinks he's being decisive; everyone else thinks 
he's steamrolling them.
Stats: Courage 7, Wit 5, Heart 6, Discipline 7, Arcana 8, Perception 4, Resilience 6, Cunning 5
---

EXAMPLE OUTPUT:
{
  "traits": [
    {
      "name": "Burden of the Name",
      "effect": "Advantage on Discipline rolls when reputation is at stake; disadvantage on Heart rolls requiring genuine vulnerability."
    },
    {
      "name": "Unformed Leader",
      "effect": "People naturally look to him in group situations (+1 to social group rolls), but he hasn't learned to listen yet — group decisions made his way override better ideas."
    },
    {
      "name": "Restless Energy",
      "effect": "Bonus on physical Courage challenges involving movement — climbing, acrobatics. Penalty on Perception when he's been still for more than an hour."
    }
  ],
  "profile": "Oliver Hopewin arrives at Boundary Waters Academy already carrying weight most first-years won't feel until graduation. He's the kind of kid who does handstands on the boathouse railing while other students are still finding their classrooms, not because he's showing off but because sitting still makes his skin itch. The Hopewin name opens doors here — his family has been in the old magic longer than Minnesota has been a state — but Oliver flinches slightly every time someone says it. He hasn't decided yet whether his legacy is a platform or a cage. In group assignments, people naturally turn toward him, waiting for a decision, and he gives one without realizing he never asked what anyone else thought. He means well. He almost always means well. His real fear isn't failure — it's waking up at forty and realizing he became the kind of Hopewin he spent his teenage years trying not to be. Some winter night this year, the lake ice will crack under someone's feet, and Oliver will be the first one moving toward the sound before he even knows what he's doing. That's who he is. The question is whether he'll remember to look behind him and see who else is coming."
}
```

---

## Usage

Feed this prompt + the raw student JSON to an LLM. Validate the output is well-formed JSON. 
Write the `traits` array to the student's `traits` column and consider adding a `profile` 
column to the schema if you want to store the narrative paragraph.