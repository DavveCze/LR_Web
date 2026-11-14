-- Migration: 006_dance_pairs_disciplines.up.sql
-- Umožňuje explicitní specifikaci třídy a disciplín pro taneční pár (LAT / STT),
-- což umožňuje tanečníkovi tančit s jedním partnerem latinu a s jiným standard.

ALTER TABLE dance_pairs
    ADD COLUMN IF NOT EXISTS category_lat VARCHAR(10) NULL,
    ADD COLUMN IF NOT EXISTS category_stt VARCHAR(10) NULL;

-- Backfill stávajících párů: odvození tříd z tanečníků
UPDATE dance_pairs p
SET category_lat = sub.cat_lat,
    category_stt = sub.cat_stt
FROM (
    SELECT 
        p2.pair_id,
        COALESCE(d1.category_lat, d2.category_lat) AS cat_lat,
        COALESCE(d1.category_stt, d2.category_stt) AS cat_stt
    FROM dance_pairs p2
    JOIN dancers d1 ON d1.idt = p2.idt1
    LEFT JOIN dancers d2 ON d2.idt = p2.idt2
) sub
WHERE p.pair_id = sub.pair_id;
