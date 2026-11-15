-- Migration Down: Remove trainer_id and group_type from training_schedule
-- Date: 2026-11-15

DROP INDEX IF EXISTS idx_training_schedule_trainer_id;

ALTER TABLE training_schedule
    DROP COLUMN IF EXISTS group_type,
    DROP COLUMN IF EXISTS trainer_id;
