-- Magic School - Student Database Schema

CREATE TABLE IF NOT EXISTS students (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  year          TEXT NOT NULL CHECK (year IN ('first-year', 'second-year', 'third-year', 'fourth-year', 'fifth-year', 'sixth-year', 'seventh-year', 'eighth-year')),
  hook          TEXT NOT NULL,
  background    TEXT NOT NULL,
  motivation    TEXT NOT NULL,
  fear          TEXT NOT NULL,
  demeanor      TEXT NOT NULL,
  strength      TEXT NOT NULL,
  weakness      TEXT NOT NULL,

  -- Stats (1–10)
  courage       INTEGER NOT NULL CHECK (courage BETWEEN 1 AND 10),
  wit           INTEGER NOT NULL CHECK (wit BETWEEN 1 AND 10),
  heart         INTEGER NOT NULL CHECK (heart BETWEEN 1 AND 10),
  discipline    INTEGER NOT NULL CHECK (discipline BETWEEN 1 AND 10),
  arcana        INTEGER NOT NULL CHECK (arcana BETWEEN 1 AND 10),
  perception    INTEGER NOT NULL CHECK (perception BETWEEN 1 AND 10),
  resilience    INTEGER NOT NULL CHECK (resilience BETWEEN 1 AND 10),
  cunning       INTEGER NOT NULL CHECK (cunning BETWEEN 1 AND 10),

  -- Traits (JSON array of trait objects)
  traits        JSONB NOT NULL DEFAULT '[]',

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Campus locations ──

CREATE TABLE IF NOT EXISTS locations (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  icon          TEXT NOT NULL,
  teaser        TEXT NOT NULL,
  description   TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Faculty ──

CREATE TABLE IF NOT EXISTS faculty (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  department    TEXT,
  species       TEXT NOT NULL DEFAULT 'human',
  hook          TEXT NOT NULL,
  background    TEXT NOT NULL,
  motivation    TEXT NOT NULL,
  fear          TEXT NOT NULL,
  demeanor      TEXT NOT NULL,
  strength      TEXT NOT NULL,
  weakness      TEXT NOT NULL,

  -- Stats (1–10)
  courage       INTEGER NOT NULL CHECK (courage BETWEEN 1 AND 10),
  wit           INTEGER NOT NULL CHECK (wit BETWEEN 1 AND 10),
  heart         INTEGER NOT NULL CHECK (heart BETWEEN 1 AND 10),
  discipline    INTEGER NOT NULL CHECK (discipline BETWEEN 1 AND 10),
  arcana        INTEGER NOT NULL CHECK (arcana BETWEEN 1 AND 10),
  perception    INTEGER NOT NULL CHECK (perception BETWEEN 1 AND 10),
  resilience    INTEGER NOT NULL CHECK (resilience BETWEEN 1 AND 10),
  cunning       INTEGER NOT NULL CHECK (cunning BETWEEN 1 AND 10),

  -- Traits (JSON array)
  traits        JSONB NOT NULL DEFAULT '[]',

  -- Where they're most often found
  location_slug TEXT REFERENCES locations(slug),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for location lookups
CREATE INDEX IF NOT EXISTS idx_faculty_location ON faculty(location_slug);

-- Trigger to auto-update updated_at on faculty
CREATE OR REPLACE FUNCTION update_faculty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_faculty_updated_at ON faculty;
CREATE TRIGGER trg_faculty_updated_at
  BEFORE UPDATE ON faculty
  FOR EACH ROW EXECUTE FUNCTION update_faculty_updated_at();