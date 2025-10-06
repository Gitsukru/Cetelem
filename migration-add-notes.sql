-- ============================================
-- MIGRATION: Notes système pour les groupes
-- ============================================
--
-- Ajouter la possibilité d'ajouter des notes :
-- - Notes personnelles (visibles que par toi)
-- - Remarques publiques (visibles par le groupe)
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. AJOUTER LA COLONNE NOTES DANS PARTICIPANTS
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 2. AJOUTER LA COLONNE PUBLIC_NOTES DANS PARTICIPANTS
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS public_notes TEXT DEFAULT '';

-- 3. INDEX POUR RECHERCHE DANS LES NOTES (optionnel, pour performance future)
CREATE INDEX IF NOT EXISTS idx_participants_notes
  ON participants USING GIN (to_tsvector('simple', notes));

CREATE INDEX IF NOT EXISTS idx_participants_public_notes
  ON participants USING GIN (to_tsvector('simple', public_notes));

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
--
-- Test:
-- UPDATE participants
-- SET notes = 'Ma note personnelle'
-- WHERE id = 'xxx';
--
-- UPDATE participants
-- SET public_notes = 'Remarque visible par tous'
-- WHERE id = 'xxx';
-- ============================================
