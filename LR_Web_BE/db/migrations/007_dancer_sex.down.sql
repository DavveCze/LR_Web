-- Migration: 007_dancer_sex.down.sql
ALTER TABLE dancers
    DROP COLUMN IF EXISTS sex;
