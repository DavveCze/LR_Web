-- Migration: 006_dance_pairs_disciplines.down.sql
-- Vrácení změn pro disciplíny párů

ALTER TABLE dance_pairs
    DROP COLUMN IF EXISTS category_stt,
    DROP COLUMN IF EXISTS category_lat;
