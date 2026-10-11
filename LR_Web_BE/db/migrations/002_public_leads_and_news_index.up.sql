-- Migration: 002_public_leads_and_news_index.up.sql
-- Description: Přidání indexu pro aktuality, tabulek pro kontaktní dotazy a přihlášky na kurzy

-- 1. Index pro vyhledávání a řazení aktualit dle data
CREATE INDEX IF NOT EXISTS idx_news_date ON news (date DESC);

-- 2. Tabulka pro kontaktní dotazy z webu
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries (created_at DESC);

-- 3. Tabulka pro přihlášky na kurzy a tábory
CREATE TABLE IF NOT EXISTS course_applications (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES registrations(id) ON DELETE SET NULL,
    course_name VARCHAR(255) NOT NULL,
    applicant_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    partner_name VARCHAR(150),
    birth_year INTEGER,
    experience_level VARCHAR(50),
    note TEXT,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_applications_course_id ON course_applications (course_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_created_at ON course_applications (created_at DESC);

-- 4. Úvodní data pro aktuality (pokud je tabulka prázdná)
INSERT INTO news (headline, text, date)
SELECT 
    'Zahájení nové taneční sezóny a zápis do kurzů',
    'Vítáme všechny tanečníky i nové zájemce v nové sezóně! Otevíráme zápisy do kurzů pro děti ze školek, škol, mládež i manželské a přátelské páry. Těšíme se na vás na parketu.',
    CURRENT_DATE - INTERVAL '14 days'
WHERE NOT EXISTS (SELECT 1 FROM news LIMIT 1);

INSERT INTO news (headline, text, date)
SELECT 
    'Úspěchy našich tanečních párů na celostátních soutěžích',
    'Gratulujeme našim soutěžním párům k vynikajícím výsledkům a finálovým umístěním na uplynulých pohárových soutěžích ČSTS ve standardních i latinskoamerických tancích.',
    CURRENT_DATE - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM news WHERE headline LIKE 'Úspěchy našich%');
