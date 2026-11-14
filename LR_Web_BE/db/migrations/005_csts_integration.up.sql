-- Migration: 005_csts_integration.up.sql
-- Podpora pro integraci s ČSTS (csts.cz): oficiální IDT, body a finále pro LAT a STT

ALTER TABLE dancers
    ADD COLUMN IF NOT EXISTS csts_idt INTEGER UNIQUE,
    ADD COLUMN IF NOT EXISTS points_lat INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS finals_lat INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_stt INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS finals_stt INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS csts_synced_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_dancers_csts_idt ON dancers (csts_idt);

ALTER TABLE dance_pairs
    ADD COLUMN IF NOT EXISTS points_lat INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS finals_lat INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_stt INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS finals_stt INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS csts_synced_at TIMESTAMP WITH TIME ZONE NULL;

-- Backfill stávajících IDT dočasně uložených v display_order
UPDATE dancers
SET csts_idt = display_order,
    display_order = 0
WHERE display_order > 100000 AND csts_idt IS NULL;
