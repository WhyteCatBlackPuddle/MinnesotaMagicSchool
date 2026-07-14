import { getFaculty, getFacultyList } from './api.js';
import { esc, initials, truncate } from './dom.js';
import { numeric, STATS, statBarHtml, storyCard, traitsHtml } from './profile-cards.js';

let faculty = [];
let selectedFacultySlug = null;
let facultyLoaded = false;

export async function ensureFacultyLoaded() {
  if (!facultyLoaded) await loadFaculty();
}

async function loadFaculty() {
  try {
    faculty = await getFacultyList();
    facultyLoaded = true;
  } catch (err) {
    console.error(err);
    faculty = [];
  }
}

export function resetFacultyDetail() {
  selectedFacultySlug = null;
  const detail = document.getElementById('faculty-detail');
  detail.classList.remove('has-selection');
  detail.innerHTML = '<div class="detail-placeholder"><strong>Select a faculty member</strong>Click a card to read their full profile, stats, and traits.</div>';
  renderFacultyCards();
}

export function renderFacultyCards() {
  const map = document.getElementById('faculty-map');
  if (!map) return;
  if (!faculty.length) {
    map.innerHTML = '<div class="empty-state">Loading faculty...</div>';
    return;
  }
  map.innerHTML = faculty.map(member => `
    <div class="faculty-card ${selectedFacultySlug === member.slug ? 'selected' : ''}" data-faculty="${member.slug}">
      <div class="faculty-avatar">${esc(initials(member.name))}</div>
      <div class="faculty-name">${esc(member.name)}</div>
      <div class="faculty-title">${esc(member.title)}</div>
      <div class="faculty-hook">${esc(truncate(member.hook, 140))}</div>
    </div>
  `).join('');
}

export async function showFacultyDetail(slug) {
  selectedFacultySlug = slug;
  renderFacultyCards();
  const detail = document.getElementById('faculty-detail');
  detail.innerHTML = '<div class="detail-placeholder"><strong>Loading profile...</strong></div>';

  try {
    const member = await getFaculty(slug);
    renderFacultyProfile(member);
  } catch (err) {
    detail.innerHTML = `<div class="detail-placeholder"><strong>Error</strong>${esc(err.message)}</div>`;
  }
}

function renderFacultyProfile(member) {
  const statsHtml = STATS.map(stat => statBarHtml(stat, numeric(member[stat]))).join('');
  const detail = document.getElementById('faculty-detail');
  detail.classList.add('has-selection');
  detail.innerHTML = `
    <button class="modal-close-btn panel-close-btn faculty-close-btn" aria-label="Close">&times;</button>
    <div class="profile-hero profile-hero-compact">
      <div class="profile-heading">
        <div class="faculty-avatar faculty-detail-avatar">${esc(initials(member.name))}</div>
        <div>
          <span class="detail-cat detail-cat-spaced">${esc(member.title)}</span>
          <h2 class="faculty-detail-name">${esc(member.name)}</h2>
        </div>
      </div>
      <p class="profile-hook">${esc(member.hook)}</p>
    </div>
    <div class="detail-section-flush">
      <div class="story-grid">
        ${storyCard('Background', member.background, 'Origins, training, and how they came to the academy.')}
        ${storyCard('Motivation', member.motivation)}
        ${storyCard('Fear', member.fear)}
        ${storyCard('Demeanor', member.demeanor)}
        ${storyCard('Strength', member.strength)}
        ${storyCard('Weakness', member.weakness)}
      </div>
      <div class="story-grid story-grid-spaced">
        <div class="stats-card"><h3>Stats</h3>${statsHtml}</div>
        <div class="traits-card"><h3>Traits</h3><div class="trait-list">${traitsHtml(member.traits)}</div></div>
      </div>
    </div>`;
  detail.querySelector('.faculty-close-btn')?.addEventListener('click', closeFacultyDetail);
}

export function closeFacultyDetail() {
  selectedFacultySlug = null;
  const detail = document.getElementById('faculty-detail');
  detail.classList.remove('has-selection');
  detail.innerHTML = '<div class="detail-placeholder"><strong>Select a faculty member</strong>Click a card to read their full profile, stats, and traits.</div>';
  renderFacultyCards();
}

export function initFaculty() {
  document.getElementById('faculty-map')?.addEventListener('click', event => {
    const card = event.target.closest('.faculty-card');
    if (card) showFacultyDetail(card.dataset.faculty);
  });
}
