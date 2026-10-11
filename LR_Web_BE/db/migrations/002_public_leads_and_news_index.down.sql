-- Migration: 002_public_leads_and_news_index.down.sql
-- Description: Rollback pro migraci 002

DROP TABLE IF EXISTS course_applications CASCADE;
DROP TABLE IF EXISTS contact_inquiries CASCADE;
DROP INDEX IF EXISTS idx_news_date;
