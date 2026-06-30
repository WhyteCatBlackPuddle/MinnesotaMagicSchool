# Modular Frontend Split — Self-Contained Prompt

Copy the entire content below into a new thread. It has everything needed: 
the task, the file to read, and exact instructions.

---

## Task

Split `db/index.html` (1455 lines, single monolithic file) into separate CSS and JS modules 
loaded by a thin HTML shell. **No behavior changes. No refactors. No bug fixes.** 
Pure mechanical extraction.

## Context

The project is a Node.js/Express app. The frontend is served from `db/index.html` at `/`. 
All other files you create should live under `db/public/`.

## Current Structure

- `db/index.html` — contains `<style>` block (~800 lines), HTML (~400 lines), `<script>` block (~400 lines)
- `db/server.js` — Express server, serves `index.html` at `/`
- `db/db.js` — Postgres pool
- `db/schema.sql` — database schema

## Target Structure

```
db/
  public/
    index.html              -- thin shell, loads modules
    css/
      root.css              -- :root variables, box-sizing, body defaults, fonts
      layout.css            -- .page-shell, .hero, .app-layout, .panel, grid systems, responsive
      components.css        -- .btn, .student-card, .stat-row, .form-card, .toast, .modal-close-btn, .trait-card, etc.
      campus.css            -- .campus-layout, .campus-map, .location-card, .campus-detail
    js/
      utils.js              -- esc(), numeric(), labelYear(), yearIndex(), statColor(), truncate(), initials(), strongestStats(), toast()
      api.js                -- loadStudents(), fetch one student, submitStudent(), all fetch calls
      state.js              -- global state: students[], activeId, currentYear, locations[], selectedLocationSlug, locationsLoaded
      roster.js             -- renderMetrics(), renderYearControls(), renderRoster(), getFilteredStudents(), studentCardHtml(), pillHtml(), setYear(), resetFilters()
      detail.js             -- showDetail(), renderDetail(), storyCard(), statBarHtml(), clearDetail(), showAddForm(), hideAddForm()
      campus.js             -- loadLocations(), ensureLocations(), renderCampusMap(), showLocationDetail(), closeCampusDetail()
      tabs.js               -- tab switching event listeners
    js/main.js              -- import everything, wire event listeners, call loadStudents() on boot
```

## How to Serve

Update `db/server.js` to serve static files from `db/public/`:

```js
app.use(express.static(join(__dirname, 'public')));
```

Then the root route serves `public/index.html`:

```js
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});
```

## Rules

1. **NO behavior changes.** The app must work identically after the split.
2. **NO refactors, no renames, no "cleanup."** Extract and move only.
3. Constants and config (`STATS`, `YEAR_ORDER`, `STAT_LABELS`) go in `utils.js` since other modules import them.
4. Use ES module syntax: `export function name() {}` and `import { name } from './path.js'`.
5. Functions that mutate shared state should import from `state.js`.
6. The HTML shell should load `js/main.js` via `<script type="module" src="/js/main.js"></script>`.
7. The HTML shell should load CSS via `<link rel="stylesheet">` tags.
8. After the split, run `node server.js` from `db/` and verify the page loads at `http://localhost:3456`.
9. Verify all functionality: search, filter, sort, year pills, student detail panel, add student form, campus tab with location cards, mobile responsive behavior, toast messages.
10. The original `db/index.html` should be **renamed** to `db/index.html.bak` at the end — do not delete it until everything is verified.

## CSS Split Map

| Destination File | CSS Rules / Selectors |
|---|---|
| `css/root.css` | `:root`, `*, *::before, *::after`, `body`, `button, input, select, textarea` |
| `css/layout.css` | `.page-shell`, `.hero`, `.hero::after`, `.hero-copy`, `.hero-stats`, `.metric`, `.tab-nav`, `.tab-btn`, `.tab-content`, `.app-layout`, `.panel`, `.roster-panel`, `.detail-panel`, `.detail-empty`, media queries for layout |
| `css/components.css` | `.btn`, `.btn-secondary`, `.toolbar`, `.field-control`, `.student-card`, `.avatar`, `.student-topline`, `.student-name`, `.student-year`, `.student-hook`, `.mini-stats`, `.mini-stat`, `.empty-chip`, `.year-pills`, `.year-pill`, `.panel-header`, `.panel-title`, `.result-count`, `.profile-hero`, `.profile-heading`, `.profile-avatar`, `.profile-year`, `.profile-hook`, `.profile-body`, `.profile-actions`, `.story-grid`, `.story-card`, `.stats-card`, `.traits-card`, `.form-card`, `.form-grid`, `.form-group`, `.hint-text`, `.form-intro`, `.form-actions`, `.side-stack`, `.stat-row`, `.stat-label`, `.stat-track`, `.stat-fill`, `.stat-value`, `.trait-list`, `.trait-card`, `.trait-name`, `.trait-effect`, `.toast`, `#add-form`, `#student-list`, `.student-list`, `.empty-state`, `.modal-close-btn`, `@keyframes modalSlideUp`, media queries for components |
| `css/campus.css` | `.campus-intro`, `.campus-layout`, `.campus-map`, `.location-card`, `.location-icon`, `.location-name`, `.location-category`, `.location-teaser`, `.campus-detail`, `.detail-cat`, `.detail-body`, `.detail-placeholder`, campus media queries |

## JS Split Map

| Destination File | Functions + Data |
|---|---|
| `js/utils.js` | `STATS` (const array), `YEAR_ORDER` (const array), `STAT_LABELS` (const object), `esc()`, `numeric()`, `labelYear()`, `yearIndex()`, `statColor()`, `truncate()`, `initials()`, `strongestStats()`, `toast()` |
| `js/api.js` | `loadStudents()`, the fetch inside `showDetail()`, `submitStudent()`, `loadLocations()` |
| `js/state.js` | `let students = []`, `let activeId = null`, `let currentYear = 'all'`, `let locations = []`, `let selectedLocationSlug = null`, `let locationsLoaded = false` |
| `js/roster.js` | `renderMetrics()`, `renderYearControls()`, `pillHtml()`, `renderRoster()`, `getFilteredStudents()`, `studentCardHtml()`, `setYear()`, `resetFilters()` |
| `js/detail.js` | `showDetail()`, `renderDetail()`, `storyCard()`, `statBarHtml()`, `clearDetail()`, `showAddForm()`, `hideAddForm()` |
| `js/campus.js` | `loadLocations()`, `ensureLocations()`, `renderCampusMap()`, `showLocationDetail()`, `closeCampusDetail()` |
| `js/tabs.js` | Tab-switching event listener setup (the `document.querySelectorAll('.tab-btn')` block) |
| `js/main.js` | Imports everything, wires all event listeners (the bottom-of-script click handlers), calls `loadStudents()` |

## Verification Checklist

After completing the split, verify ALL of these:

- [ ] Page loads without 404s or JS errors
- [ ] Student roster renders
- [ ] Hero metrics (total, years, first-years) display correctly
- [ ] Search filters students
- [ ] Year dropdown and pills filter correctly
- [ ] Sort dropdown works (by ID, name, year, arcana, heart, courage)
- [ ] Clicking a student opens detail panel
- [ ] Detail panel shows avatar, name, year, hook, all narrative cards, stat bars (correct widths & colors), traits
- [ ] Close button in detail panel works
- [ ] "New student" button shows add form
- [ ] Add form validates and submits
- [ ] Cancel button returns to previous state
- [ ] "Campus" tab loads location cards
- [ ] Clicking a location shows detail
- [ ] Campus detail close button works
- [ ] Switching back to Students tab preserves state
- [ ] Toast messages appear and disappear
- [ ] Mobile responsive: narrower than 1100px triggers modal overlays
- [ ] Mobile responsive: narrower than 760px stacks to single column
- [ ] Console has no errors
- [ ] Network tab shows all module loads succeeding (200)
