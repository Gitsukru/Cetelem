-- ============================================================================
-- Ajouter device_id pour rate limiting
-- ============================================================================
--
-- Prérequis avant rate-limiting-per-user.sql
-- Ajoute device_id aux tables pour tracking
--
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Ajouter device_id à analytics_events
ALTER TABLE analytics_events
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Index pour rate limiting queries
CREATE INDEX IF NOT EXISTS idx_analytics_device_created
ON analytics_events(device_id, created_at DESC);

-- 2. Ajouter device_id à participants (optionnel, pour tracking multi-device)
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 3. Ajouter device_id à groups (tracking création)
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS created_by_device TEXT;

CREATE INDEX IF NOT EXISTS idx_groups_device_created
ON groups(created_by_device, created_at DESC);

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Vérifier colonnes ajoutées
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('analytics_events', 'participants', 'groups')
  AND column_name LIKE '%device%'
ORDER BY table_name, column_name;
