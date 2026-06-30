# Magic School — Project Roadmap & Implementation Plan

> **Status:** Planning. This is the master reference for what needs doing across the project.
> Last updated: 2026-06-29

**Goal:** Evolve the Boundary Waters Academy from a student roster into a full narrative world — faculty, courses, relationships, and a maintainable codebase.

**Architecture:** PostgreSQL (Neon) + Express API + single-page JS frontend. Vercel-deployed.

---

## Current State

| Asset | Count | Notes |
|---|---|---|
| Students | 29 | All fully fleshed (narrative + stats + traits). 18 first-years, 5 second-years, 2 third-years, 2 fourth-years, 1 fifth-year, 1 sixth-year |
| Locations | 14 | Buildings, water features, wilderness areas, village spots |
| Faculty | 0 | No table exists yet |
| Courses | 0 | No table exists yet |
| Relationships | 0 | No table exists yet |
| Frontend | 1 file | `db/index.html` is 1455 lines — single monolithic file |
| API | Full CRUD | Students only. Locations are read-only. No faculty/courses/relationships endpoints |

---

## Phase 1: Data Foundation (DB + API)

### 1.1 Add `is_active` to students

**Why:** 29 students is a lot. Flag the core cast as active, park the rest for later.

```
Schema change:
  ALTER TABLE students ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  UPDATE students SET is_active = false WHERE id IN (...);  -- park extras
```

**Files:** `db/schema.sql`, `db/server.js` (add `is_active` to API returns, filter support)

### 1.2 Student relationships table

```sql
CREATE TABLE student_relationships (
  id           SERIAL PRIMARY KEY,
  student_a    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_b    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,    -- 'friends', 'rivals', 'roommates', 'siblings', 'mentor', 'crush', etc.
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (student_a < student_b)  -- canonical ordering, prevents self-relations
);
```

**API endpoints:**
- `GET /api/students/:id/relationships` — returns all relationships for a student
- `POST /api/students/:id/relationships` — create a relationship
- `DELETE /api/relationships/:id` — remove one

### 1.3 Faculty table

```sql
CREATE TABLE faculty (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,    -- 'Professor of Herbology', 'Headmaster', etc.
  department   TEXT,
  description  TEXT NOT NULL,    -- ~2-3 paragraphs of character
  demeanor     TEXT,             -- personality sketch
  species      TEXT DEFAULT 'human',  -- 'human', 'lynx (maybe)', etc.
  location_id  INTEGER REFERENCES locations(id),  -- where they're most often found
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Target: 8-12 faculty** for the initial seed. Key roles:
- Headmaster/mistress
- Arcana department head
- Herbology & Healing instructor
- Workshop master (making is magic)
- Water-sense instructor (Marta at the boathouse)
- Wilderness / Winter Survival instructor
- Kitchen head (already in lore)
- Librarian (already in lore — the lynx-or-woman)
- Village elder / Trading Post keeper
- Groundskeeper / Gardens

**API endpoints:**
- `GET /api/faculty` — list all
- `GET /api/faculty/:slug` — get one

### 1.4 Courses table

```sql
CREATE TABLE courses (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  department   TEXT NOT NULL,
  year_level   TEXT,             -- NULL = all years, or 'first-year', 'senior', etc.
  description  TEXT NOT NULL,
  instructor   TEXT,             -- free text for now; can FK to faculty later
  location_slug TEXT REFERENCES locations(slug),
  is_core      BOOLEAN DEFAULT false,
  is_required  BOOLEAN DEFAULT false,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Target: 12-16 courses.** Mix of practical, mystical, and pastoral:
- Introduction to Water-Sense (core, first-years, boathouse)
- Spellcraft Foundations (core, first-years)
- Old Pine Lore (elective, the forest as living memory)
- Workshop Practice (core, making = magic)
- Lake Studies (elective, limnology + liminality)
- Sauna and Self (required, pastoral care)
- Winter Survival (required, first-years, wilderness)
- Runes and Binding (elective, advanced)
- Village Rotation (required, working the kitchen/gardens/trading post)
- The Crossing (required, orientation, first-years only)
- Herbology and Healing (core)
- Northern Constellations (elective, astronomy + divination)
- Canoe Craft and Watercraft (elective)
- The Deep Lake Seminar (elective, advanced, by invitation)

**API endpoints:**
- `GET /api/courses` — list all
- `GET /api/courses/:slug` — get one

---

## Phase 2: UI (simple additions)

### 2.1 Show relationships in student detail panel

When viewing a student, show their relationships in the sidebar below traits. Simple linked names with relationship type.

### 2.2 Add active/inactive filter to roster

A toggle or pill in the toolbar: "Active" / "All". Default to active only.

### 2.3 Faculty tab

New tab alongside Students and Campus: "Faculty". Simple card grid, click for detail panel (similar to campus location pattern).

### 2.4 Courses tab

New tab: "Courses". Grid of course cards grouped by department. Click for full description.

---

## Phase 3: Frontend Architecture (Modular Split)

**Current:** `db/index.html` — 1455 lines, one file containing HTML + CSS + JS.

**Target:** Break into modules for maintainability and token efficiency.

```
db/
  public/
    index.html              -- thin shell, defers to modules
    css/
      reset.css             -- box-sizing, body defaults, root vars
      layout.css            -- page-shell, grid systems, responsive
      components.css        -- cards, panels, forms, toasts, buttons
      campus.css            -- campus-specific styles
    js/
      api.js                -- all fetch calls
      state.js              -- global state (students[], activeId, etc.)
      roster.js             -- search/filter/sort/render roster
      detail.js             -- student detail panel rendering
      form.js               -- add-student form logic
      campus.js             -- campus tab logic
      tabs.js               -- tab switching
      utils.js              -- esc(), numeric(), labelYear(), statColor(), toast(), etc.
```

**The split is mechanical** — no behavior changes, no refactors. The HTML shell loads each JS module via `<script type="module">` and they import from each other.

---

## Phase 4: Content (Worldbuilding)

### 4.1 Choose the active student cast

Pick 8-12 students as the "active" core. Mark the rest inactive. The active set should span at least 2-3 years for cross-year dynamics.

### 4.2 Wire relationships

For the active cast, define the web — friends, rivals, roommates, crushes, siblings, mentors. This is narrative work, not code.

### 4.3 Seed faculty

Write 8-12 faculty profiles in the same style as the student seeds. Warm, specific, human (mostly).

### 4.4 Seed courses

Write course descriptions. These say a lot about the school's philosophy.

### 4.5 Narrative generation pipeline

A script that reads a student from the API, analyzes their data, and produces:
- 3 traits with mechanical effects
- A ~200-word character profile paragraph

Could live as `db/generate-profile.js` using an LLM API call, or a structured prompt for manual use.

---

## Priority Order

1. **`is_active` column** — 10 minute schema change, immediately clarifies the cast
2. **Relationships table + API** — enables the web of connections
3. **Faculty table + API + seed** — populates the adult world
4. **Courses table + API + seed** — defines the school's curriculum and philosophy
5. **Frontend tabs for faculty/courses** — simple grid views
6. **Relationship display in detail panel** — connections become visible
7. **Active/inactive roster filter** — clean up the UI
8. **Modular frontend split** — maintainability
9. **Content work** — choosing active cast, wiring relationships, writing faculty/courses