import { esc } from './dom.js';

export const STATS = ['courage', 'wit', 'heart', 'discipline', 'arcana', 'perception', 'resilience', 'cunning'];
export const YEAR_ORDER = ['first-year', 'second-year', 'third-year', 'fourth-year', 'fifth-year', 'sixth-year', 'seventh-year', 'eighth-year'];
export const STAT_LABELS = {
  courage: 'Courage', wit: 'Wit', heart: 'Heart', discipline: 'Discipline',
  arcana: 'Arcana', perception: 'Perception', resilience: 'Resilience', cunning: 'Cunning',
};

export function storyCard(label, value, hint) {
  const subtitle = hint ? `<div class="story-hint">${esc(hint)}</div>` : '';
  return `<article class="story-card"><h3>${esc(label)}</h3>${subtitle}<p>${esc(value || 'Not recorded yet.')}</p></article>`;
}

export function statBarHtml(stat, value) {
  const safeValue = Math.max(0, Math.min(10, numeric(value || 0)));
  return `
    <div class="stat-row">
      <span class="stat-label">${STAT_LABELS[stat]}</span>
      <span class="stat-track"><span class="stat-fill stat-fill-value-${safeValue}"></span></span>
      <span class="stat-value">${safeValue || '-'}/10</span>
    </div>`;
}

export function labelYear(year) {
  return String(year || 'Unassigned').replace('-', ' ');
}

export function yearIndex(year) {
  const idx = YEAR_ORDER.indexOf(year);
  return idx === -1 ? 99 : idx;
}

export function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function strongestStats(record, count) {
  return STATS
    .map(stat => [stat, numeric(record[stat])])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || STAT_LABELS[a[0]].localeCompare(STAT_LABELS[b[0]]))
    .slice(0, count);
}

export function traitsHtml(traits) {
  return Array.isArray(traits) && traits.length
    ? traits.map(trait => `<div class="trait-card"><div class="trait-name">${esc(trait.name)}</div><div class="trait-effect">${esc(trait.effect)}</div></div>`).join('')
    : '<span class="empty-chip">Traits pending</span>';
}
