# Magic School Project Cleanup Plan

> **For Hermes:** Use this as an implementation roadmap. Execute in small branches or commits, verify after each phase, and avoid changing behavior unless the task explicitly says to.

**Goal:** Make the Boundary Waters Academy project easier to navigate, extend, and deploy without breaking the working Express/PostgreSQL app.

**Architecture:** Keep the current top-level shape: `src/` for server code, `public/` for browser assets, `database/` for schema/migrations, `scripts/` for maintenance tools, and `api/` for Vercel. The next cleanup should split the remaining monoliths, remove legacy leftovers, add lightweight verification, and document the new conventions.

**Tech Stack:** Node.js 22, Express, PostgreSQL via `pg`, browser HTML/CSS/JS, Vercel serverless entrypoint.

---

## Current Findings

### Current non-dependency project files

- Root config/docs: `package.json`, `package-lock.json`, `vercel.json`, `README.md`, `.gitignore`, `.env.example`
- Runtime: `src/server.js`, `src/db.js`, `api/index.js`
- UI: `public/index.html`
- Database: `database/schema.sql`
- Scripts: `scripts/setup.js`, `scripts/seed.js`, `scripts/seed-locations.js`, `scripts/seed-faculty.js`, `scripts/add-student.js`, `scripts/bulk-add.js`, `scripts/view-students.js`, `scripts/cli.js`
- Local planning docs: `.hermes/plans/*.md`
- Legacy local secret still present but ignored: `db/.env`

### Main cleanliness problems

1. `public/index.html` is still a 1,639-line all-in-one file.
   - CSS starts at `public/index.html:10`.
   - JS starts at `public/index.html:1103`.
   - Inline styles remain in generated markup around `public/index.html:1289`, `1475-1476`, and `1560-1580`.
2. `src/server.js` is a 240-line route monolith.
   - Student routes, location routes, faculty routes, health route, static serving, validation, and server startup are all in one file.
3. Seed scripts contain large inline data blobs.
   - `scripts/seed-faculty.js` is 287 lines and mixes data with insert logic.
   - `scripts/seed-locations.js` is short in line count but dense, with location records compressed into long lines.
   - `scripts/seed.js` mixes student seed data and insertion logic.
4. No canonical verification script exists.
   - `package.json` has no `test`, `lint`, `check`, or `verify` script.
   - Verification has been done with ad-hoc scripts only.
5. A legacy `db/.env` remains in the main folder.
   - It is ignored, not committed, and should not be printed.
   - It exists only because the previous layout expected env data under `db/`.
6. README is accurate but too thin for future work.
   - It lacks troubleshooting, branch/worktree notes, local server guidance, DB setup detail, and verification commands.

---

## Proposed End State

```text
api/
  index.js

database/
  schema.sql
  seeds/
    students.js
    locations.js
    faculty.js

public/
  index.html
  css/
    root.css
    layout.css
    components.css
    students.css
    campus.css
    faculty.css
  js/
    main.js
    api.js
    dom.js
    profile-cards.js
    students.js
    student-form.js
    campus.js
    faculty.js

scripts/
  setup.js
  seed.js
  add-student.js
  bulk-add.js
  view-students.js
  cli.js
  verify.js

src/
  app.js
  server.js
  db.js
  routes/
    students.js
    locations.js
    faculty.js
    health.js
  lib/
    async-route.js
    validation.js
    fields.js
```

Keep this simple. Do not introduce a framework, bundler, TypeScript, React, or a migration library yet.

---

## Phase 1: Remove Legacy Leftovers and Tighten Root Hygiene

**Objective:** Make the visible project tree match the new layout and avoid confusing future work.

**Files:**
- Remove local-only: `db/.env`
- Modify: `.gitignore`
- Modify: `README.md`

**Steps:**

1. Confirm root `.env` exists and has `DATABASE_URL` without printing the value.
2. Delete the old ignored `db/.env` file.
3. Remove the empty `db/` folder if it remains.
4. Keep `.gitignore` entries:
   - `node_modules/`
   - `.env`
   - `.worktrees/`
5. Add README notes:
   - Root `.env` is now the only supported local env path.
   - Use `npm start` from project root.
   - Use alternate `PORT=3460 npm start` for worktree testing.

**Verification:**

```sh
find db -maxdepth 2 -type f 2>/dev/null
# Expected: no output, or db does not exist

test -f .env && echo "root env present"

git status --short
# Expected: only intended deletions/modifications
```

---

## Phase 2: Add a First-Class Verification Script

**Objective:** Replace repeated ad-hoc verification with a stable project command.

**Files:**
- Create: `scripts/verify.js`
- Modify: `package.json`
- Modify: `README.md`

**Plan:**

Create `scripts/verify.js` that checks the surfaces this project actually depends on:

1. Required files exist.
2. `node --check` equivalent for JS files, using `node:child_process`.
3. `api/index.js` imports the Express app with `process.env.VERCEL='1'` and does not start a listener.
4. Starts the app on a temporary port.
5. Requests `/` and checks for `<title>Boundary Waters Academy</title>`.
6. Requests `/api/health`.
   - If DB credentials are present, require `status: ok`.
   - If DB credentials are absent, allow a JSON error but report it clearly.
7. If DB is reachable, request `/api/students` and assert it returns an array.

Add scripts:

```json
"check": "node scripts/verify.js",
"verify": "node scripts/verify.js"
```

**Verification:**

```sh
npm run verify
# Expected: prints each check and exits 0
```

---

## Phase 3: Split Frontend CSS Out of `public/index.html`

**Objective:** Make the UI styles maintainable without changing visuals.

**Files:**
- Modify: `public/index.html`
- Create: `public/css/root.css`
- Create: `public/css/layout.css`
- Create: `public/css/components.css`
- Create: `public/css/students.css`
- Create: `public/css/campus.css`
- Create: `public/css/faculty.css`

**Steps:**

1. Move `:root`, resets, body, shared typography to `public/css/root.css`.
2. Move page shell, hero, tabs, toolbar, panels, responsive layout to `public/css/layout.css`.
3. Move buttons, form controls, cards, toast, modal classes to `public/css/components.css`.
4. Move student roster/detail/form styles to `public/css/students.css`.
5. Move campus layout/location card/detail styles to `public/css/campus.css`.
6. Move faculty card/detail styles to `public/css/faculty.css`.
7. Replace the `<style>` block in `public/index.html` with stylesheet links in this order:

```html
<link rel="stylesheet" href="/css/root.css">
<link rel="stylesheet" href="/css/layout.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/students.css">
<link rel="stylesheet" href="/css/campus.css">
<link rel="stylesheet" href="/css/faculty.css">
```

**Verification:**

```sh
npm run verify
curl -fsS http://localhost:3456/css/root.css | head
curl -fsS http://localhost:3456/css/faculty.css | head
```

Open the browser and check Students, Campus, and Faculty tabs for visual regressions.

---

## Phase 4: Remove Static Inline Styles from JS Markup

**Objective:** Keep presentation in CSS, not template strings.

**Files:**
- Modify: `public/index.html`
- Modify: `public/css/components.css`
- Modify: `public/css/campus.css`
- Modify: `public/css/faculty.css`

**Known inline style sites:**

- `public/index.html:1289` stat bar width/color. This one is dynamic and can remain temporarily, or become bounded stat classes.
- `public/index.html:1475-1476` campus detail close/icon static styles.
- `public/index.html:1560-1580` faculty detail static styles.

**Steps:**

1. Add classes for campus detail close button and detail icon.
2. Add classes for faculty detail hero, avatar, title, name, and lower story grid.
3. Replace static `style="..."` attributes with these classes.
4. For stat fill, either:
   - Keep dynamic inline width as a temporary exception, or
   - Add `.stat-fill-value-0` through `.stat-fill-value-10` and color range classes.

**Verification:**

```sh
npm run verify
rg 'style=' public/index.html
# Expected: only truly dynamic stat-fill style remains, or no output if bounded classes are implemented.
```

---

## Phase 5: Split Frontend JavaScript into Modules

**Objective:** Turn the 500+ lines of inline JS into feature modules.

**Files:**
- Modify: `public/index.html`
- Create: `public/js/api.js`
- Create: `public/js/dom.js`
- Create: `public/js/profile-cards.js`
- Create: `public/js/students.js`
- Create: `public/js/student-form.js`
- Create: `public/js/campus.js`
- Create: `public/js/faculty.js`
- Create: `public/js/main.js`

**Module responsibilities:**

- `api.js`
  - `fetchJson(path, options)`
  - `getStudents()`, `getStudent(id)`, `createStudent(body)`
  - `getLocations()`, `getFacultyList()`, `getFaculty(slug)`
- `dom.js`
  - `esc(value)`, `initials(name)`, `truncate(value, length)`, `toast(message, isErr)`
- `profile-cards.js`
  - `STATS`, `STAT_LABELS`, `numeric(value)`, `statBarHtml(stat, value)`, `storyCard(label, value, hint)`
- `students.js`
  - roster state, filters, detail rendering
- `student-form.js`
  - form submit/body construction and add form show/hide helpers
- `campus.js`
  - location loading, cards, detail sidebar
- `faculty.js`
  - faculty loading, cards, detail sidebar
- `main.js`
  - DOM lookup, tab switching, event wiring, initial load

**HTML change:**

Replace inline `<script>` with:

```html
<script type="module" src="/js/main.js"></script>
```

**Verification:**

```sh
npm run verify
curl -fsS http://localhost:3456/js/main.js
curl -fsS http://localhost:3456/js/students.js
```

Browser verification:

- Load `/`
- Console has no JS errors.
- Students roster loads.
- Student detail opens/closes.
- New student form opens/cancels.
- Campus tab loads cards and details.
- Faculty tab loads cards and details.

---

## Phase 6: Split Express Routes by Entity

**Objective:** Make backend API changes less risky.

**Files:**
- Modify: `src/server.js`
- Create: `src/app.js`
- Create: `src/routes/students.js`
- Create: `src/routes/locations.js`
- Create: `src/routes/faculty.js`
- Create: `src/routes/health.js`
- Create: `src/lib/async-route.js`
- Create: `src/lib/fields.js`
- Create: `src/lib/validation.js`
- Modify: `api/index.js`

**Proposed structure:**

- `src/app.js` creates and exports the Express app.
- `src/server.js` imports app and starts `listen()` only outside Vercel.
- `api/index.js` imports `../src/app.js` instead of `../src/server.js`.
- Route files export Express routers.
- Shared constants move to `src/lib/fields.js`:
  - `STATS`
  - `STUDENT_REQUIRED_FIELDS`
  - `FACULTY_REQUIRED_FIELDS`

**Route registration order:**

```js
app.use('/api/students', studentsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/health', healthRouter);
app.use('/api/faculty', facultyRouter);
```

Inside route files, keep list routes before parameter routes.

**Verification:**

```sh
npm run verify
curl -fsS http://localhost:3456/api/students
curl -fsS http://localhost:3456/api/locations
curl -fsS http://localhost:3456/api/faculty
curl -fsS http://localhost:3456/api/health
```

---

## Phase 7: Extract Seed Data from Seed Logic

**Objective:** Make world/content data easier to edit without touching database code.

**Files:**
- Create: `database/seeds/students.js`
- Create: `database/seeds/locations.js`
- Create: `database/seeds/faculty.js`
- Modify: `scripts/seed.js`
- Modify: `scripts/seed-locations.js`
- Modify: `scripts/seed-faculty.js`

**Steps:**

1. Move arrays out of script files into `database/seeds/*.js`.
2. Export named arrays:

```js
export const students = [/* existing student objects */];
export const locations = [/* existing location objects */];
export const faculty = [/* existing faculty objects */];
```

3. Import them from scripts.
4. Keep database insertion/update logic in `scripts/`.
5. Format `locations.js` with one object field per line for readability.

**Verification:**

```sh
npm run verify
node --check database/seeds/students.js
node --check database/seeds/locations.js
node --check database/seeds/faculty.js
```

Do not run destructive seed scripts against Neon unless explicitly intended.

---

## Phase 8: Normalize Database Schema Organization

**Objective:** Prepare for future schema changes without adding a heavy migration tool.

**Files:**
- Keep: `database/schema.sql`
- Optionally create: `database/migrations/001_initial.sql`
- Modify: `scripts/setup.js`
- Modify: `README.md`

**Recommended lightweight approach:**

- Keep `database/schema.sql` as the canonical current schema.
- Add `database/migrations/` only when the next schema change happens.
- Do not invent migration history retroactively unless needed.

**Immediate cleanup:**

1. Add `updated_at` to `locations` for consistency, if desired.
2. Use one shared trigger function name for all updated_at triggers instead of separate student/faculty functions.
3. Add indexes for common lookups:
   - `students(year)`
   - `faculty(slug)` already has unique index via constraint.
   - `locations(slug)` already has unique index via constraint.

**Verification:**

```sh
npm run setup
npm run verify
```

Only run this if you intend to apply schema changes to the configured database.

---

## Phase 9: Improve README and Developer Workflow Docs

**Objective:** Make the project self-explanatory when opened in VS Code.

**Files:**
- Modify: `README.md`
- Optional create: `docs/development.md`
- Optional create: `docs/deployment.md`

**README additions:**

- Quick start:
  - `npm install`
  - create/copy `.env`
  - `npm start`
  - open `http://localhost:3456`
- DB notes:
  - Do not commit `.env`.
  - `DATABASE_URL` should point to Neon or local Postgres.
- Project map with one sentence per folder.
- Verification:
  - `npm run verify`
- Common tasks:
  - Add a student
  - Seed faculty
  - Apply schema
- Vercel notes:
  - `api/index.js` is the serverless entrypoint.
  - `vercel.json` rewrites all traffic to the API app.

**Verification:**

Manual read-through plus `npm run verify`.

---

## Phase 10: Optional Quality Improvements

These are useful, but not required for the immediate cleanup.

### Add formatting

Add Prettier for HTML/CSS/JS formatting.

Files:
- `package.json`
- `.prettierrc`
- `.prettierignore`

Scripts:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

Risk: formatting `public/index.html` before splitting it may create a huge diff. Prefer after frontend extraction.

### Add minimal tests

Add Node's built-in test runner with a small set of route tests.

Files:
- `tests/app.test.js`
- `package.json`

Script:

```json
"test": "node --test"
```

Start with tests that import the app and test route wiring using mocked DB only if mocking is simple. If mocking gets messy, keep `scripts/verify.js` as the primary safety net for now.

### Add `.vscode/settings.json`

Optional if you want consistent editor behavior.

Possible settings:

```json
{
  "files.exclude": {
    "node_modules": true,
    ".worktrees": true
  }
}
```

---

## Recommended Implementation Order

1. Phase 1: remove legacy `db/.env` and empty `db/` folder.
2. Phase 2: add `npm run verify`.
3. Phase 3: extract CSS.
4. Phase 4: remove static inline styles.
5. Phase 5: extract frontend JS modules.
6. Phase 6: split Express routes.
7. Phase 7: extract seed data.
8. Phase 9: expand README/docs.
9. Phase 8 and Phase 10 as follow-ups when needed.

This order gives you a safety net first, then tackles the biggest mess: the frontend monolith.

---

## Risks and Guardrails

- Do not touch `.env` contents or print secrets.
- Do not run seed scripts against Neon unless the user explicitly wants data reset/overwrite.
- After splitting frontend files, verify static serving for every new CSS/JS file.
- Keep API route behavior unchanged while splitting `src/server.js`.
- Commit each phase separately so regressions are easy to revert.
- Use alternate ports for verification if `3456` is already in use.

---

## Done Criteria

The project cleanup is successful when:

- No non-secret legacy files remain under `db/`.
- `public/index.html` is mostly semantic HTML, not a CSS/JS dumping ground.
- `src/server.js` only starts the server; app setup and routes are modular.
- Seed data lives under `database/seeds/`.
- `npm run verify` exists and passes.
- README tells a new developer how to run, verify, and deploy the app.
- Browser checks for Students, Campus, and Faculty pass with no console errors.
