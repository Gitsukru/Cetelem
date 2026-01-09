-- Migration: Add half_position field for 1/2 cüz feature
-- Date: 2026-01-09
-- Description: Allows participants to take half a cüz (10 pages) instead of full (20 pages)

-- Step 1: Add the half_position column
ALTER TABLE hatim_participations
ADD COLUMN IF NOT EXISTS half_position INTEGER NULL
CHECK (half_position IS NULL OR half_position IN (1, 2));

-- Step 2: Drop the old unique constraint (if exists)
ALTER TABLE hatim_participations
DROP CONSTRAINT IF EXISTS hatim_participations_hatim_id_round_number_unit_number_key;

-- Step 3: Create partial unique indexes for proper NULL handling
-- Index for full unit claims (half_position IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participations_full_unit
ON hatim_participations (hatim_id, round_number, unit_number)
WHERE half_position IS NULL;

-- Index for half unit claims (half_position IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participations_half_unit
ON hatim_participations (hatim_id, round_number, unit_number, half_position)
WHERE half_position IS NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN hatim_participations.half_position IS
'NULL=full cüz (20 pages), 1=first half (pages 1-10 of cüz), 2=second half (pages 11-20 of cüz)';

-- Note: Existing data with half_position = NULL will continue to work as full cüz claims
