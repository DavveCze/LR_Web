-- Migration: Add trainer_id and group_type to training_schedule
-- Date: 2026-11-15

ALTER TABLE training_schedule
    ADD COLUMN IF NOT EXISTS trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS group_type VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_training_schedule_trainer_id
    ON training_schedule(trainer_id);

-- Migrate existing data from subtitle to trainer_id and group_type
UPDATE training_schedule
SET trainer_id = (SELECT id FROM trainers WHERE full_name ILIKE '%Lukáš%' LIMIT 1)
WHERE subtitle ILIKE '%Lukáš%' AND trainer_id IS NULL;

UPDATE training_schedule
SET trainer_id = (SELECT id FROM trainers WHERE full_name ILIKE '%Vašek%' LIMIT 1)
WHERE subtitle ILIKE '%Vašek%' AND trainer_id IS NULL;

UPDATE training_schedule
SET trainer_id = (SELECT id FROM trainers WHERE full_name ILIKE '%Marketa%' OR full_name ILIKE '%Markéta%' LIMIT 1)
WHERE subtitle ILIKE '%Marki%' AND trainer_id IS NULL;

UPDATE training_schedule
SET trainer_id = (SELECT id FROM trainers WHERE full_name ILIKE '%Klára%' OR full_name ILIKE '%Klara%' LIMIT 1)
WHERE subtitle ILIKE '%Klárka%' AND trainer_id IS NULL;

-- Extract and populate group_type for existing records
UPDATE training_schedule
SET group_type = 'děti HOBBY'
WHERE subtitle ILIKE '%děti HOBBY%' AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'děti E+D'
WHERE subtitle ILIKE '%děti E+D%' AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'přípravka'
WHERE subtitle ILIKE '%přípravka%' AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'LAT'
WHERE (subtitle ILIKE '%latina%' OR subtitle ILIKE '%LAT%') AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'STT'
WHERE (subtitle ILIKE '%standart%' OR subtitle ILIKE '%standard%' OR subtitle ILIKE '%STT%') AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'sólo'
WHERE subtitle ILIKE '%sólo%' AND (group_type IS NULL OR group_type = '');

UPDATE training_schedule
SET group_type = 'od 15:00'
WHERE subtitle ILIKE '%od 15:00%' AND (group_type IS NULL OR group_type = '');
