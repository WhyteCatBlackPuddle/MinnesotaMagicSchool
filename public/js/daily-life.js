import { esc } from './dom.js';
import {
  loadDailyLifeState,
  resetDailyLifeState,
  resolveDailyChoice,
  startNextDay,
  STATE_NAMES,
  STAT_NAMES,
} from './daily-life-engine.js';

let state = null;
let toast = () => {};

function scoreClass(value, max = 10) {
  const normalized = max === 10 ? value : value * 2;
  return `stat-fill-value-${Math.max(0, Math.min(10, Number(normalized) || 0))}`;
}

function renderScoreRow(label, value, max = 10) {
  return `
    <div class="daily-score-row">
      <span class="daily-score-label">${esc(label)}</span>
      <span class="stat-track"><span class="stat-fill ${scoreClass(value, max)}"></span></span>
      <span class="daily-score-value">${esc(value)}/${max}</span>
    </div>
  `;
}

function renderStudentCard() {
  const student = state.student;
  const stats = STAT_NAMES.map(name => renderScoreRow(name, state.stats[name], 10)).join('');
  const states = STATE_NAMES.map(name => renderScoreRow(name, state.states[name], 5)).join('');

  return `
    <section class="daily-panel daily-student-card">
      <div class="daily-kicker">Active student</div>
      <h2>${esc(student.name)}</h2>
      <p>${esc(student.year)} in ${esc(student.lodge)}</p>
      <p>${esc(student.hook || '')}</p>
      <p><strong>Affinity:</strong> ${esc(student.affinity)}</p>
      <div class="daily-score-grid">
        <div>
          <h3>Stats</h3>
          ${stats}
        </div>
        <div>
          <h3>Current states</h3>
          ${states}
        </div>
      </div>
    </section>
  `;
}

function renderDaySummary() {
  if (!state.currentDay) {
    return `
      <section class="daily-panel daily-story-panel">
        <div class="daily-kicker">No day in progress</div>
        <h2>Begin the first daily check-in</h2>
        <p>The engine will make hidden background rolls for morning condition, class pressure, and social texture. Then it will stop at one meaningful influence point.</p>
        <button class="btn" type="button" id="start-day-btn">Begin next school day</button>
      </section>
    `;
  }

  const day = state.currentDay;
  const paragraphs = day.summary.map(text => `<p>${esc(text)}</p>`).join('');
  const resolution = day.resolution ? `
    <div class="daily-resolution">
      <div class="daily-kicker">Resolved</div>
      <h3>${esc(day.resolution.outcome)}</h3>
      <p>${esc(day.resolution.narrative)}</p>
      <p><strong>Effect:</strong> ${esc(day.resolution.effect)}</p>
      <button class="btn" type="button" id="start-day-btn">Begin next school day</button>
    </div>
  ` : '';

  return `
    <section class="daily-panel daily-story-panel">
      <div class="daily-kicker">${esc(day.title)}</div>
      <h2>A day in the life</h2>
      <div class="daily-thread">${paragraphs}</div>
      ${day.resolved ? resolution : renderDecision(day.decision)}
    </section>
  `;
}

function renderDecision(decision) {
  const choices = decision.choices.map(choice => `
    <button class="daily-choice-card" type="button" data-choice-id="${esc(choice.id)}">
      <span>${esc(choice.label)}</span>
      <small>Rolls ${esc(choice.stats.join(' + '))}</small>
    </button>
  `).join('');

  return `
    <div class="daily-decision">
      <div class="daily-kicker">Influence point</div>
      <h3>${esc(decision.title)}</h3>
      <p>${esc(decision.moment)}</p>
      <p class="daily-stakes"><strong>Stakes:</strong> ${esc(decision.stakes)}</p>
      <div class="daily-choice-grid">${choices}</div>
    </div>
  `;
}

function renderLists() {
  const memories = state.memories.length
    ? state.memories.map(memory => `<li><strong>Day ${esc(memory.day)}:</strong> ${esc(memory.text)}</li>`).join('')
    : '<li>No memories recorded yet.</li>';
  const threads = state.threads.length
    ? state.threads.map(thread => `<li>${esc(thread)}</li>`).join('')
    : '<li>No open threads yet.</li>';
  const relationships = state.relationships.map(item => `
    <li>
      <strong>${esc(item.name)}</strong>
      <span>Trust ${esc(item.value)}</span>
      <p>${esc(item.note)}</p>
    </li>
  `).join('');

  return `
    <section class="daily-side-grid">
      <div class="daily-panel">
        <h3>Memories</h3>
        <ul class="daily-list">${memories}</ul>
      </div>
      <div class="daily-panel">
        <h3>Open threads</h3>
        <ul class="daily-list">${threads}</ul>
      </div>
      <div class="daily-panel">
        <h3>Relationships</h3>
        <ul class="daily-list daily-relationship-list">${relationships}</ul>
      </div>
    </section>
  `;
}

function renderDailyLife() {
  const root = document.getElementById('daily-life-root');
  if (!root) return;
  root.innerHTML = `
    <div class="daily-life-layout">
      <div class="daily-main-stack">
        ${renderStudentCard()}
        ${renderDaySummary()}
      </div>
      ${renderLists()}
    </div>
  `;
}

function startDay() {
  state = startNextDay();
  renderDailyLife();
  toast(`School Day ${state.day} generated. Hidden rolls were added to the Roll Log.`);
}

function resolveChoice(choiceId) {
  state = resolveDailyChoice(choiceId);
  renderDailyLife();
  toast('Decision resolved. The visible roll was added to the Roll Log.');
}

function resetPlaytest() {
  state = resetDailyLifeState();
  renderDailyLife();
  toast('Daily life playtest reset. Roll Log cleared.');
}

export function initDailyLife(toastFn) {
  toast = toastFn || toast;
  state = loadDailyLifeState();
  renderDailyLife();

  document.getElementById('daily-life-root')?.addEventListener('click', event => {
    const startButton = event.target.closest('#start-day-btn');
    if (startButton) startDay();

    const choiceButton = event.target.closest('[data-choice-id]');
    if (choiceButton) resolveChoice(choiceButton.dataset.choiceId);
  });

  document.getElementById('daily-life-reset-btn')?.addEventListener('click', resetPlaytest);
}
