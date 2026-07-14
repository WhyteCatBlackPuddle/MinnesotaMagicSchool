import { createStudent, getStudent, getStudents } from './api.js';
import { esc, initials, truncate } from './dom.js';
import { studentFormBody } from './student-form.js';
import {
  labelYear,
  numeric,
  STAT_LABELS,
  STATS,
  statBarHtml,
  storyCard,
  strongestStats,
  traitsHtml,
  YEAR_ORDER,
  yearIndex,
} from './profile-cards.js';

let students = [];
let activeId = null;
let currentYear = 'all';
let els;
let toast;

export function initStudents(elements, toastFn) {
  els = elements;
  toast = toastFn;

  els.list.addEventListener('click', event => {
    const card = event.target.closest('.student-card');
    if (card) showDetail(card.dataset.id);
  });
  els.yearPills.addEventListener('click', event => {
    const pill = event.target.closest('.year-pill');
    if (pill) setYear(pill.dataset.year);
  });
  els.search.addEventListener('input', renderRoster);
  els.sort.addEventListener('change', renderRoster);
  els.yearFilter.addEventListener('change', event => setYear(event.target.value));
  els.reset.addEventListener('click', resetFilters);
  els.newStudent.addEventListener('click', showAddForm);
  els.cancelAdd.addEventListener('click', () => {
    hideAddForm();
    if (activeId) showDetail(activeId);
  });
  els.form.addEventListener('submit', submitStudent);
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.querySelector('.detail-panel').classList.remove('modal-open');
    clearDetail();
  });

  loadStudents();
}

async function loadStudents() {
  try {
    students = await getStudents();
    renderMetrics();
    renderYearControls();
    renderRoster();
  } catch (err) {
    els.list.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
    toast(err.message, true);
  }
}

function renderMetrics() {
  const yearCount = new Set(students.map(student => student.year).filter(Boolean)).size;
  const firstYears = students.filter(student => student.year === 'first-year').length;
  els.metricTotal.textContent = students.length;
  els.metricYears.textContent = yearCount;
  els.metricFirstYears.textContent = firstYears;
}

function renderYearControls() {
  const existingYears = YEAR_ORDER.filter(year => students.some(student => student.year === year));
  const options = ['<option value="all">All years</option>', ...existingYears.map(year => `<option value="${year}">${labelYear(year)}</option>`)].join('');
  if (els.yearFilter.innerHTML !== options) els.yearFilter.innerHTML = options;
  els.yearFilter.value = currentYear;

  els.yearPills.innerHTML = [
    pillHtml('all', `All (${students.length})`),
    ...existingYears.map(year => pillHtml(year, `${labelYear(year)} (${students.filter(student => student.year === year).length})`)),
  ].join('');
}

function pillHtml(value, label) {
  return `<button class="year-pill ${currentYear === value ? 'active' : ''}" type="button" data-year="${value}">${esc(label)}</button>`;
}

function renderRoster() {
  const filtered = getFilteredStudents();
  els.resultCount.textContent = `${filtered.length} of ${students.length}`;

  if (!filtered.length) {
    els.list.innerHTML = '<div class="empty-state">No students match those filters.</div>';
    return;
  }

  els.list.innerHTML = filtered.map(studentCardHtml).join('');
}

function getFilteredStudents() {
  const query = els.search.value.trim().toLowerCase();
  const sortMode = els.sort.value;
  let filtered = students.filter(student => currentYear === 'all' || student.year === currentYear);

  if (query) {
    filtered = filtered.filter(student => [student.name, student.year, student.hook].some(value => String(value || '').toLowerCase().includes(query)));
  }

  return filtered.sort((a, b) => {
    if (sortMode === 'name') return String(a.name).localeCompare(String(b.name));
    if (sortMode === 'year') return yearIndex(a.year) - yearIndex(b.year) || a.id - b.id;
    if (STATS.includes(sortMode)) return numeric(b[sortMode]) - numeric(a[sortMode]) || String(a.name).localeCompare(String(b.name));
    return a.id - b.id;
  });
}

function studentCardHtml(student) {
  const topStats = strongestStats(student, 2).map(([name, value]) => `<span class="mini-stat">${STAT_LABELS[name]} ${value}</span>`).join('');
  return `
    <button class="student-card ${activeId === student.id ? 'active' : ''}" type="button" data-id="${student.id}">
      <span class="avatar">${esc(initials(student.name))}</span>
      <span>
        <span class="student-topline">
          <span class="student-name">${esc(student.name)}</span>
          <span class="student-year">${esc(labelYear(student.year))}</span>
        </span>
        <span class="student-hook">${esc(truncate(student.hook, 132))}</span>
        <span class="mini-stats">${topStats || '<span class="empty-chip">Stats pending</span>'}</span>
      </span>
    </button>`;
}

async function showDetail(id, { scrollCard = true } = {}) {
  activeId = Number(id);
  hideAddForm(false);
  renderRoster();
  if (scrollCard) document.querySelector(`.student-card[data-id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' });

  els.detail.className = '';
  els.detail.innerHTML = '<div class="detail-empty"><div><strong>Opening profile...</strong>Gathering the full student record.</div></div>';

  try {
    const student = await getStudent(activeId);
    renderDetail(student);
  } catch (err) {
    els.detail.className = 'detail-empty';
    els.detail.innerHTML = `<div><strong>Could not open profile</strong>${esc(err.message)}</div>`;
    toast(err.message, true);
  }
}

function renderDetail(student) {
  const statsHtml = STATS.map(stat => statBarHtml(stat, numeric(student[stat]))).join('');

  els.detail.className = '';
  els.detail.innerHTML = `
    <div class="profile-hero">
      <div class="profile-actions">
        <button class="btn btn-secondary" type="button" id="close-detail-btn">Close</button>
      </div>
      <div class="profile-heading">
        <div class="profile-avatar">${esc(initials(student.name))}</div>
        <div>
          <span class="profile-year">${esc(labelYear(student.year))}</span>
          <h2>${esc(student.name)}</h2>
        </div>
      </div>
      <p class="profile-hook">${esc(student.hook)}</p>
    </div>
    <div class="profile-body">
      <div class="story-grid">
        ${storyCard('Background', student.background, 'Family, hometown, and how magic found them.')}
        ${storyCard('Motivation', student.motivation)}
        ${storyCard('Fear', student.fear)}
        ${storyCard('Demeanor', student.demeanor)}
        ${storyCard('Strength', student.strength)}
        ${storyCard('Weakness', student.weakness)}
      </div>
      <aside class="side-stack">
        <div class="stats-card"><h3>Stats</h3>${statsHtml}</div>
        <div class="traits-card"><h3>Traits</h3><div class="trait-list">${traitsHtml(student.traits)}</div></div>
      </aside>
    </div>`;

  document.getElementById('close-detail-btn')?.addEventListener('click', clearDetail);
  document.querySelector('.detail-panel').classList.add('modal-open');
}

function showAddForm() {
  els.addForm.classList.add('visible');
  els.detail.classList.add('hidden');
  activeId = null;
  renderRoster();
  document.getElementById('name')?.focus();
  document.querySelector('.detail-panel').classList.add('modal-open');
}

function hideAddForm(showDetailPanel = true) {
  els.addForm.classList.remove('visible');
  if (showDetailPanel) els.detail.classList.remove('hidden');
  if (!activeId) document.querySelector('.detail-panel').classList.remove('modal-open');
}

async function submitStudent(event) {
  event.preventDefault();
  const body = studentFormBody(event.target);

  try {
    const data = await createStudent(body);
    toast(`${data.name} added`);
    event.target.reset();
    hideAddForm();
    activeId = data.id;
    await loadStudents();
  } catch (err) {
    toast(err.message, true);
  }
}

function clearDetail() {
  activeId = null;
  renderRoster();
  els.detail.className = 'detail-empty';
  els.detail.innerHTML = '<div><strong>Select a student</strong>Pick someone from the roster to open their full profile, stats, and traits.<br><br>To add someone to the directory, click <strong>New student</strong> in the toolbar above.</div>';
  document.querySelector('.detail-panel').classList.remove('modal-open');
}

function setYear(value) {
  currentYear = value;
  els.yearFilter.value = value;
  renderYearControls();
  renderRoster();
}

function resetFilters() {
  els.search.value = '';
  els.sort.value = 'id';
  setYear('all');
}
