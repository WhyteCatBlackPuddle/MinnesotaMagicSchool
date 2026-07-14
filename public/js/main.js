import { ensureLocationsLoaded, initCampus, renderLocationCards, resetCampusDetail } from './campus.js';
import { initDailyLife } from './daily-life.js';
import { createToast } from './dom.js';
import { ensureFacultyLoaded, initFaculty, renderFacultyCards, resetFacultyDetail } from './faculty.js';
import { initRollLog } from './roll-log.js';
import { initStudents } from './students.js';

const els = {
  list: document.getElementById('student-list'),
  resultCount: document.getElementById('result-count'),
  metricTotal: document.getElementById('metric-total'),
  metricYears: document.getElementById('metric-years'),
  metricFirstYears: document.getElementById('metric-first-years'),
  search: document.getElementById('search-input'),
  yearFilter: document.getElementById('year-filter'),
  sort: document.getElementById('sort-select'),
  reset: document.getElementById('reset-btn'),
  newStudent: document.getElementById('new-student-btn'),
  yearPills: document.getElementById('year-pills'),
  detail: document.getElementById('detail'),
  addForm: document.getElementById('add-form'),
  form: document.getElementById('student-form'),
  cancelAdd: document.getElementById('cancel-add-btn'),
  toast: document.getElementById('toast'),
};

const toast = createToast(els.toast);

initStudents(els, toast);
initCampus();
initFaculty();
initRollLog();
initDailyLife(toast);

document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const tab = button.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    button.classList.add('active');

    const content = document.getElementById('tab-' + tab);
    if (content) content.classList.add('active');

    if (tab === 'campus') {
      await ensureLocationsLoaded();
      renderLocationCards();
      resetCampusDetail();
    }

    if (tab === 'faculty') {
      await ensureFacultyLoaded();
      renderFacultyCards();
      resetFacultyDetail();
    }

    if (tab === 'living-map') {
      const frame = document.getElementById('living-map-frame');
      if (frame && !frame.src) frame.src = frame.dataset.src;
    }
  });
});
