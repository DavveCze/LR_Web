-- Migration: 008_competition_results_created_at.down.sql
DROP INDEX IF EXISTS idx_competition_results_created_at;

ALTER TABLE competition_results
    DROP COLUMN IF EXISTS created_at;
