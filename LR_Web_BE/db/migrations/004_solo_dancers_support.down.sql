-- Migration: 004_solo_dancers_support.down.sql
-- Návrat zpět k povinnému druhému tanečníkovi v páru.

DROP INDEX IF EXISTS dance_pairs_solo_unique;
DROP INDEX IF EXISTS dance_pairs_unordered_unique;

-- Smazání sólo záznamů před obnovením NOT NULL (aby nedošlo k chybě)
DELETE FROM dance_pairs WHERE idt2 IS NULL;

ALTER TABLE dance_pairs ALTER COLUMN idt2 SET NOT NULL;

CREATE UNIQUE INDEX dance_pairs_unordered_unique 
    ON dance_pairs (LEAST(idt1, idt2), GREATEST(idt1, idt2));

ALTER TABLE dance_pairs ADD CONSTRAINT dance_pairs_idt1_idt2_key UNIQUE (idt1, idt2);
