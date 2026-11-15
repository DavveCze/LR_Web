-- Migration: 007_dancer_sex.up.sql
-- Přidává sloupec sex ('M' / 'F') do dancers,
-- a zajišťuje, že v tanečních párech je muž vždy na první pozici (idt1) a žena na druhé (idt2).

ALTER TABLE dancers
    ADD COLUMN IF NOT EXISTS sex VARCHAR(1) DEFAULT 'M';

-- Backfill stávajících tanečníků podle příjmení a křestního jména
UPDATE dancers
SET sex = 'F'
WHERE LOWER(surname) LIKE '%ová'
   OR LOWER(surname) LIKE '%á'
   OR LOWER(name) IN ('vanesa', 'viktorie', 'denisa', 'dominika', 'eliška', 'zuzana', 'sophie', 'inu', 'kunda', 'anna', 'marie', 'lucie', 'tereza', 'adéla', 'karolína', 'natálie', 'kristýna', 'barbora');

UPDATE dancers
SET sex = 'M'
WHERE sex IS NULL OR sex NOT IN ('M', 'F');

-- Prohození idt1 a idt2 u existujících párů, kde byla žena na první pozici a muž na druhé
UPDATE dance_pairs p
SET idt1 = sub.male_id,
    idt2 = sub.female_id
FROM (
    SELECT 
        p2.pair_id,
        d2.idt AS male_id,
        d1.idt AS female_id
    FROM dance_pairs p2
    JOIN dancers d1 ON p2.idt1 = d1.idt
    JOIN dancers d2 ON p2.idt2 = d2.idt
    WHERE d1.sex = 'F' AND d2.sex = 'M'
) sub
WHERE p.pair_id = sub.pair_id;
