-- Migration: 003_news_articles_enhancement.up.sql
-- Description: Rozšíření tabulky news o titulní fotografii, přesná časová razítka vytvoření a aktualizace

ALTER TABLE news
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL;

-- Synchronizace created_at pro stávající řádky s existujícím sloupcem date
UPDATE news
SET created_at = date::timestamptz
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_news_created_at ON news (created_at DESC);
