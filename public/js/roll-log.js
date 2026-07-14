import { esc } from './dom.js';

const ROLL_STORAGE_KEY = 'bwa-roll-log-v1';

let activeFilter = 'all';

function rollMatchesFilter(roll) {
  return activeFilter === 'all' || roll.visibility === activeFilter;
}

function renderRollLog() {
  const list = document.getElementById('roll-log-list');
  const empty = document.getElementById('roll-log-empty');
  if (!list || !empty) return;

  const rolls = getRolls().filter(rollMatchesFilter);
  empty.hidden = rolls.length > 0;
  list.innerHTML = rolls.map(roll => `
    <article class="roll-card roll-card-${esc(roll.visibility)}">
      <div class="roll-card-topline">
        <span>${esc(roll.day)}</span>
        <span>${esc(roll.time)}</span>
      </div>
      <div class="roll-card-header">
        <h3>${esc(roll.title)}</h3>
        <span class="roll-visibility roll-visibility-${esc(roll.visibility)}">${roll.visibility === 'hidden' ? 'Hidden during play' : 'Visible during play'}</span>
      </div>
      <dl class="roll-details">
        <div>
          <dt>Formula</dt>
          <dd>${esc(roll.formula)}</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>${esc(roll.result)}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>${esc(roll.outcome)}</dd>
        </div>
        <div>
          <dt>Effect</dt>
          <dd>${esc(roll.effect)}</dd>
        </div>
      </dl>
      <p class="roll-narrative">${esc(roll.narrative)}</p>
    </article>
  `).join('');
}

function setActiveFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('[data-roll-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.rollFilter === filter);
  });
  renderRollLog();
}

export function getRolls() {
  try {
    const rolls = JSON.parse(localStorage.getItem(ROLL_STORAGE_KEY));
    return Array.isArray(rolls) ? rolls : [];
  } catch {
    return [];
  }
}

export function saveRolls(rolls) {
  localStorage.setItem(ROLL_STORAGE_KEY, JSON.stringify(rolls));
  window.dispatchEvent(new CustomEvent('roll-log-updated'));
}

export function appendRolls(rolls) {
  const nextRolls = [...rolls, ...getRolls()].slice(0, 80);
  saveRolls(nextRolls);
}

export function clearRolls() {
  saveRolls([]);
}

export function initRollLog() {
  document.querySelectorAll('[data-roll-filter]').forEach(button => {
    button.addEventListener('click', () => setActiveFilter(button.dataset.rollFilter));
  });
  window.addEventListener('roll-log-updated', renderRollLog);
  renderRollLog();
}