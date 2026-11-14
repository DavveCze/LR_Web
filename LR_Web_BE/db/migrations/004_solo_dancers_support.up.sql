-- Migration: 004_solo_dancers_support.up.sql
-- Umožňuje taneční pár s jedním člověkem (sólo tanečník) pro soutěžní výsledky a přehled.

ALTER TABLE dance_pairs ALTER COLUMN idt2 DROP NOT NULL;

-- Odstranění původních unikátních omezení, která vyžadovala NOT NULL u idt2
ALTER TABLE dance_pairs DROP CONSTRAINT IF EXISTS dance_pairs_idt1_idt2_key;
DROP INDEX IF EXISTS dance_pairs_unordered_unique;

-- Nové indexy pro páry (oba tanečníci) i sólo (pouze idt1 s idt2 IS NULL)
CREATE UNIQUE INDEX dance_pairs_unordered_unique 
    ON dance_pairs (LEAST(idt1, idt2), GREATEST(idt1, idt2)) 
    WHERE idt2 IS NOT NULL;

CREATE UNIQUE INDEX dance_pairs_solo_unique 
    ON dance_pairs (idt1) 
    WHERE idt2 IS NULL;
