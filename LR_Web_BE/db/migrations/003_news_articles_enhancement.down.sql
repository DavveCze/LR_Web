-- Migration: 003_news_articles_enhancement.down.sql
DROP INDEX IF EXISTS idx_news_created_at;

ALTER TABLE news
    DROP COLUMN IF EXISTS image_url,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at;
