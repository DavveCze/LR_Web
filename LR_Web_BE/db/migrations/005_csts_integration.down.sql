-- Migration: 005_csts_integration.down.sql
-- Vrácení změn pro integraci ČSTS

DROP INDEX IF EXISTS idx_dancers_csts_idt;

ALTER TABLE dancers
    DROP COLUMN IF EXISTS csts_synced_at,
    DROP COLUMN IF EXISTS finals_stt,
    DROP COLUMN IF EXISTS points_stt,
    DROP COLUMN IF EXISTS finals_lat,
    DROP COLUMN IF EXISTS points_lat,
    DROP COLUMN IF EXISTS csts_idt;

ALTER TABLE dance_pairs
    DROP COLUMN IF EXISTS csts_synced_at,
    DROP COLUMN IF EXISTS finals_stt,
    DROP COLUMN IF EXISTS points_stt,
    DROP COLUMN IF EXISTS finals_lat,
    DROP COLUMN IF EXISTS points_lat;
