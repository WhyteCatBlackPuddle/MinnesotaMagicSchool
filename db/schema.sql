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