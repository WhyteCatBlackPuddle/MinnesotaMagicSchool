import { appendRolls, clearRolls } from './roll-log.js';

const STATE_STORAGE_KEY = 'bwa-daily-life-state-v1';

const STAT_NAMES = ['Focus', 'Heart', 'Wits', 'Grit', 'Poise', 'Affinity'];
const STATE_NAMES = ['Energy', 'Stress', 'Belonging', 'Confidence', 'Affinity Stability'];

const decisionTemplates = [
  {
    title: 'The Satchel Strap',
    moment: 'After dinner, the same second-year who made the lunchroom joke is alone near the boot room, trying to repair a torn satchel strap before inspection. Your student could keep walking, but they have just enough time to do something about it.',
    stakes: 'This could open a complicated relationship thread, or it could make the student feel foolish for trying.',
    choices: [
      { id: 'help-anyway', label: 'Help anyway, but do not pretend the joke was fine.', stats: ['Heart', 'Wits'], approach: 'kind but honest' },
      { id: 'ask-directly', label: 'Ask why the second-year singled them out at lunch.', stats: ['Poise', 'Heart'], approach: 'direct and vulnerable' },
      { id: 'quiet-distance', label: 'Keep walking and save their energy for tomorrow.', stats: ['Focus', 'Grit'], approach: 'self-protective' },
    ],
  },
  {
    title: 'The Shaking Chalk Line',
    moment: 'During afternoon Arcana, the containment circle begins trembling around another first-year. Everyone sees it, but the instructor is across the room correcting a different spell.',
    stakes: 'Stepping in might help, embarrass both students, or draw attention to your student’s own unstable affinity.',
    choices: [
      { id: 'steady-circle', label: 'Step closer and quietly help steady the circle.', stats: ['Focus', 'Affinity'], approach: 'careful magical support' },
      { id: 'call-teacher', label: 'Call for the instructor before the circle fails.', stats: ['Wits', 'Poise'], approach: 'public caution' },
      { id: 'comfort-classmate', label: 'Talk the other student through their panic.', stats: ['Heart', 'Poise'], approach: 'emotional steadiness' },
    ],
  },
  {
    title: 'The Empty Seat',
    moment: 'At lunch, one first-year from the lodge sits apart from everyone else. Your student notices because nobody else seems to. There is an empty seat beside them, and also a louder table where your student has been trying to belong.',
    stakes: 'A small social choice might shape who your student becomes in the lodge.',
    choices: [
      { id: 'sit-with-lonely', label: 'Sit with the lonely student.', stats: ['Heart', 'Poise'], approach: 'visible kindness' },
      { id: 'bring-them-over', label: 'Invite them to the louder table.', stats: ['Wits', 'Heart'], approach: 'social bridge-building' },
      { id: 'choose-belonging', label: 'Go to the louder table and protect their own fragile belonging.', stats: ['Poise', 'Grit'], approach: 'self-preservation' },
    ],
  },
];

function defaultState() {
  return {
    student: {
      name: 'Oliver Hopewin',
      year: 'first-year',
      lodge: 'North Pine Lodge',
      affinity: 'old Great Lakes family magic, disciplined early but heavy with expectation',
      hook: 'A first-year from an old Minnesota magical family, trying to prove he is Oliver and not just another Hopewin heir.',
    },
    day: 0,
    stats: {
      Focus: 7,
      Heart: 6,
      Wits: 5,
      Grit: 7,
      Poise: 6,
      Affinity: 8,
    },
    states: {
      Energy: 4,
      Stress: 3,
      Belonging: 2,
      Confidence: 3,
      'Affinity Stability': 4,
    },
    relationships: [
      { name: 'Mara Vale', note: 'A first-year who notices more than she says, and may notice the person under the crest.', value: 0 },
      { name: 'Torben Hall', note: 'Workshop instructor, unimpressed by family names but patient with useful effort.', value: 1 },
      { name: 'Professor Voss', note: 'Arcana instructor, aware that Oliver has training and pressure in equal measure.', value: 0 },
    ],
    memories: [],
    threads: [
      'Proving himself as Oliver, not simply as a Hopewin.',
      'Learning to lead without steamrolling the students around him.',
      'Deciding what to do with the family burden he was taught to carry.',
    ],
    currentDay: null,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value, min = 0, max = 5) {
  return Math.max(min, Math.min(max, value));
}

function rollDie(sides = 20) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return (values[0] % sides) + 1;
}

function statModifier(value) {
  if (value <= 2) return -2;
  if (value <= 4) return -1;
  if (value <= 6) return 0;
  if (value <= 8) return 1;
  return 2;
}

function stateModifier(name, value) {
  if (name === 'Stress') {
    if (value <= 1) return 1;
    if (value >= 5) return -2;
    if (value >= 4) return -1;
    return 0;
  }
  if (value <= 1) return -2;
  if (value === 2) return -1;
  if (value === 3) return 0;
  if (value === 4) return 1;
  return 2;
}

function outcomeFor(total) {
  if (total <= 5) return 'Things go badly';
  if (total <= 10) return 'Partial success with a cost';
  if (total <= 15) return 'Success with a complication';
  if (total <= 19) return 'Clear success';
  return 'Strong success';
}

function formulaFor(parts) {
  const labels = parts.map(part => part.name).join(' + ');
  return `d20 + ${labels}`;
}

function createRoll(state, config) {
  const parts = [
    ...(config.stats || []).map(name => ({ name, modifier: statModifier(state.stats[name] || 0) })),
    ...(config.states || []).map(name => ({ name, modifier: stateModifier(name, state.states[name] || 0) })),
    ...(config.modifiers || []),
  ];
  const die = rollDie();
  const modifierTotal = parts.reduce((sum, part) => sum + part.modifier, 0);
  const total = die + modifierTotal;
  const sign = modifierTotal >= 0 ? '+' : '-';
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    day: `Day ${state.day}`,
    time: config.time,
    title: config.title,
    visibility: config.visibility,
    formula: formulaFor(parts),
    die,
    total,
    result: `${die} ${sign} ${Math.abs(modifierTotal)} = ${total}`,
    outcome: outcomeFor(total),
    effect: '',
    narrative: '',
  };
}

function applyState(state, name, delta) {
  state.states[name] = clamp((state.states[name] || 0) + delta);
}

function addMemory(state, text) {
  state.memories = [{ day: state.day, text }, ...state.memories].slice(0, 8);
}

function updateRelationship(state, name, delta, note) {
  const relationship = state.relationships.find(item => item.name === name);
  if (!relationship) return;
  relationship.value = clamp(relationship.value + delta, -2, 5);
  if (note) relationship.note = note;
}

function resolveMorning(state) {
  const roll = createRoll(state, {
    time: 'Morning',
    title: 'Waking Condition',
    visibility: 'hidden',
    stats: ['Grit'],
    states: ['Energy'],
  });

  if (roll.total >= 16) {
    applyState(state, 'Energy', 1);
    roll.effect = 'Energy +1';
    roll.narrative = 'The student wakes before the bell, warm under the quilts, with enough steadiness to notice the lake turning silver through the frost.';
  } else if (roll.total >= 11) {
    roll.effect = 'No state change';
    roll.narrative = 'Morning comes plainly. Boots are found, hair is flattened, and the student reaches breakfast without either triumph or disaster.';
  } else if (roll.total >= 6) {
    applyState(state, 'Energy', -1);
    roll.effect = 'Energy -1';
    roll.narrative = 'The lodge is slow and smoky from a stubborn stove. The student starts the day cold-fingered and a little behind everyone else.';
  } else {
    applyState(state, 'Energy', -1);
    applyState(state, 'Stress', 1);
    roll.effect = 'Energy -1, Stress +1';
    roll.narrative = 'The student wakes from a dream of knocking inside the walls. By breakfast, three spoons have rattled off the table whenever they look away.';
  }
  return roll;
}

function resolveArcana(state) {
  const roll = createRoll(state, {
    time: 'Arcana',
    title: 'Containment Practice',
    visibility: 'hidden',
    stats: ['Focus', 'Affinity'],
    states: ['Affinity Stability', 'Stress'],
  });

  if (roll.total >= 16) {
    applyState(state, 'Confidence', 1);
    applyState(state, 'Affinity Stability', 1);
    roll.effect = 'Confidence +1, Affinity Stability +1';
    roll.narrative = 'In Arcana, the chalk circle holds. Not perfectly, but long enough that Professor Voss stops beside the desk and says, quietly, “Better.”';
  } else if (roll.total >= 11) {
    applyState(state, 'Stress', 1);
    roll.effect = 'Stress +1';
    roll.narrative = 'In Arcana, the containment circle works only after a sharp correction. The student learns something useful, but their ears burn for the rest of class.';
  } else if (roll.total >= 6) {
    applyState(state, 'Affinity Stability', -1);
    applyState(state, 'Stress', 1);
    roll.effect = 'Affinity Stability -1, Stress +1';
    roll.narrative = 'The chalk line twitches out of shape twice. No one is hurt, but the room goes very quiet in the way classrooms do when everyone wants to stare politely.';
  } else {
    applyState(state, 'Affinity Stability', -1);
    applyState(state, 'Confidence', -1);
    applyState(state, 'Stress', 1);
    roll.effect = 'Affinity Stability -1, Confidence -1, Stress +1';
    roll.narrative = 'The circle splits and a little snap of blue light jumps to the window latch. Professor Voss handles it at once, but the student sees her make a note.';
  }
  return roll;
}

function resolveSocial(state) {
  const roll = createRoll(state, {
    time: 'Lunch',
    title: 'Finding a Place at the Table',
    visibility: 'hidden',
    stats: ['Heart', 'Poise'],
    states: ['Belonging', 'Confidence'],
  });

  if (roll.total >= 16) {
    applyState(state, 'Belonging', 1);
    roll.effect = 'Belonging +1';
    roll.narrative = 'At lunch, Mara saves a seat with her mitten on the bench. It is a tiny thing, but the student feels the day shift around it.';
  } else if (roll.total >= 11) {
    roll.effect = 'No state change';
    roll.narrative = 'Lunch is noisy and survivable. The student laughs once at the right moment, then spends the rest of the meal listening.';
  } else if (roll.total >= 6) {
    applyState(state, 'Confidence', -1);
    roll.effect = 'Confidence -1';
    roll.narrative = 'A joke from the far end of the table lands strangely. The student cannot tell if it was about them, which somehow makes it worse.';
  } else {
    applyState(state, 'Belonging', -1);
    applyState(state, 'Stress', 1);
    roll.effect = 'Belonging -1, Stress +1';
    roll.narrative = 'The student reaches the table just as the last easy seat disappears. Nobody is cruel. That almost makes the loneliness sharper.';
  }
  return roll;
}

function decisionForDay(day) {
  return clone(decisionTemplates[(day - 1) % decisionTemplates.length]);
}

function narrativeFromChoice(choice, roll, state) {
  const name = state.student.name;
  if (roll.total >= 20) {
    return `${name} follows the ${choice.approach} impulse with unexpected grace. The moment does more than solve the problem, it reveals a better version of who they could become.`;
  }
  if (roll.total >= 16) {
    return `${name} acts on the ${choice.approach} impulse, and it works. Not loudly, not perfectly, but clearly enough that the day ends with a little more courage than it began.`;
  }
  if (roll.total >= 11) {
    return `${name} tries the ${choice.approach} path. It mostly works, though the result is awkward enough to leave a question hanging for tomorrow.`;
  }
  if (roll.total >= 6) {
    return `${name} tries to follow the ${choice.approach} impulse, but the moment costs more than expected. Something good still happens, but not without embarrassment.`;
  }
  return `${name} reaches for the ${choice.approach} choice and fumbles it. The failure does not close the story. It leaves a bruise, a lesson, and a thread that will matter later.`;
}

function effectFromChoice(state, choice, roll) {
  if (roll.total >= 20) {
    applyState(state, 'Confidence', 1);
    applyState(state, 'Belonging', 1);
    addMemory(state, `A choice guided by ${choice.stats.join(' and ')} revealed real growth.`);
    return 'Confidence +1, Belonging +1, memory added';
  }
  if (roll.total >= 16) {
    applyState(state, 'Confidence', 1);
    addMemory(state, `Handled ${choice.label.toLowerCase()} with steadiness.`);
    return 'Confidence +1, memory added';
  }
  if (roll.total >= 11) {
    applyState(state, 'Stress', 1);
    addMemory(state, `Tried ${choice.label.toLowerCase()}, with mixed results.`);
    return 'Stress +1, memory added';
  }
  if (roll.total >= 6) {
    applyState(state, 'Energy', -1);
    applyState(state, 'Stress', 1);
    addMemory(state, `Learned that ${choice.label.toLowerCase()} can cost more than expected.`);
    return 'Energy -1, Stress +1, memory added';
  }
  applyState(state, 'Confidence', -1);
  applyState(state, 'Stress', 1);
  addMemory(state, `Fumbled ${choice.label.toLowerCase()}, but the story stayed open.`);
  return 'Confidence -1, Stress +1, memory added';
}

function saveState(state) {
  localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
}

export function loadDailyLifeState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STATE_STORAGE_KEY));
    if (stored?.student?.name === 'Oliver Hopewin' && stored?.stats && stored?.states) return stored;
  } catch {
    // fall through to a fresh playtest state
  }
  const state = defaultState();
  saveState(state);
  return state;
}

export function resetDailyLifeState() {
  const state = defaultState();
  saveState(state);
  clearRolls();
  return state;
}

export function startNextDay() {
  const state = loadDailyLifeState();
  state.day += 1;
  const hiddenRolls = [resolveMorning(state), resolveArcana(state), resolveSocial(state)];
  state.currentDay = {
    day: state.day,
    title: `School Day ${state.day}`,
    summary: hiddenRolls.map(roll => roll.narrative),
    decision: decisionForDay(state.day),
    resolved: false,
    resolution: null,
  };
  saveState(state);
  appendRolls(hiddenRolls);
  return state;
}

export function resolveDailyChoice(choiceId) {
  const state = loadDailyLifeState();
  const decision = state.currentDay?.decision;
  if (!decision || state.currentDay.resolved) return state;
  const choice = decision.choices.find(item => item.id === choiceId);
  if (!choice) return state;

  const roll = createRoll(state, {
    time: 'Decision Point',
    title: `Your Influence: ${choice.label}`,
    visibility: 'visible',
    stats: choice.stats,
    states: ['Energy', 'Stress'],
  });
  roll.narrative = narrativeFromChoice(choice, roll, state);
  roll.effect = effectFromChoice(state, choice, roll);

  if (choice.id === 'help-anyway' && roll.total >= 11) {
    updateRelationship(state, 'Mara Vale', 1, 'Mara saw the student choose kindness when it was not easy.');
  }
  if (!state.threads.includes(decision.title)) {
    state.threads = [decision.title, ...state.threads].slice(0, 5);
  }

  state.currentDay.resolved = true;
  state.currentDay.resolution = {
    choice: choice.label,
    narrative: roll.narrative,
    outcome: roll.outcome,
    effect: roll.effect,
  };
  saveState(state);
  appendRolls([roll]);
  return state;
}

export { STAT_NAMES, STATE_NAMES };
