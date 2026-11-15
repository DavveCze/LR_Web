-- Migration: 008_competition_results_created_at.up.sql
-- Přidává sloupec created_at do competition_results pro evidenci data vložení výsledků [stav k D.M.YY]

ALTER TABLE competition_results
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Pro stávající řádky před zavedením evidovaného času nastavíme created_at na datum konání (nebo NOW)
UPDATE competition_results
SET created_at = date::timestamptz
WHERE created_at IS NULL AND id < 9;

UPDATE competition_results
SET created_at = NOW()
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_competition_results_created_at ON competition_results (created_at DESC);
