import { getLocations } from './api.js';
import { esc } from './dom.js';

let locations = [];
let selectedLocationSlug = null;
let locationsLoaded = false;

export async function ensureLocationsLoaded() {
  if (!locationsLoaded) await loadLocations();
}

async function loadLocations() {
  try {
    locations = await getLocations();
    locationsLoaded = true;
  } catch (err) {
    console.error(err);
    locations = [];
  }
}

export function resetCampusDetail() {
  selectedLocationSlug = null;
  const detail = document.getElementById('campus-detail');
  detail.classList.remove('has-selection');
  detail.innerHTML = '<div class="detail-placeholder"><strong>Select a location</strong>Click a place on the map to read about it.</div>';
  renderLocationCards();
}

export function renderLocationCards() {
  const map = document.getElementById('campus-map');
  if (!locations.length) {
    map.innerHTML = '<div class="empty-state">Loading campus...</div>';
    return;
  }
  map.innerHTML = locations.map(location => `
    <div class="location-card ${selectedLocationSlug === location.slug ? 'selected' : ''}" data-location="${location.slug}">
      <div class="location-icon">${esc(location.icon)}</div>
      <div class="location-name">${esc(location.name)}</div>
      <div class="location-category">${esc(location.category)}</div>
      <div class="location-teaser">${esc(location.teaser)}</div>
    </div>
  `).join('');
}

export function showLocationDetail(slug) {
  selectedLocationSlug = slug;
  const location = locations.find(item => item.slug === slug);
  const detail = document.getElementById('campus-detail');
  if (!location) return;
  detail.classList.add('has-selection');
  detail.innerHTML = `
    <button class="modal-close-btn panel-close-btn campus-close-btn" aria-label="Close">&times;</button>
    <div class="location-icon detail-icon-large">${esc(location.icon)}</div>
    <h3>${esc(location.name)}</h3>
    <span class="detail-cat">${esc(location.category)}</span>
    <div class="detail-body">${esc(location.description)}</div>
  `;
  detail.querySelector('.campus-close-btn')?.addEventListener('click', closeCampusDetail);
  renderLocationCards();
}

export function closeCampusDetail() {
  selectedLocationSlug = null;
  const detail = document.getElementById('campus-detail');
  detail.classList.remove('has-selection');
  detail.innerHTML = '<div class="detail-placeholder"><strong>Select a location</strong>Click a place on the map to read about it.</div>';
  renderLocationCards();
}

export function initCampus() {
  document.getElementById('campus-map')?.addEventListener('click', event => {
    const card = event.target.closest('.location-card');
    if (card) showLocationDetail(card.dataset.location);
  });
}
