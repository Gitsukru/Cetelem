-- ============================================
-- MIGRATION: Add private notes for categories
-- ============================================
--
-- Ajouter la possibilité d'avoir des notes privées
-- ET publiques pour chaque catégorie
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. AJOUTER LA COLONNE PRIVATE_NOTE
ALTER TABLE category_notes
ADD COLUMN IF NOT EXISTS private_note TEXT DEFAULT '';

-- 2. RENOMMER LA COLONNE 'note' EN 'public_note' POUR CLARTÉ
-- (Optionnel - on peut garder 'note' pour la note publique)
-- Pour l'instant on garde 'note' = public, 'private_note' = privé

-- 3. INDEX POUR RECHERCHE (optionnel)
CREATE INDEX IF NOT EXISTS idx_category_notes_private
  ON category_notes USING GIN (to_tsvector('simple', private_note));

-- ============================================
-- MIGRATION TERMINÉE !
-- ============================================
--
-- Structure finale:
-- - note = note publique (visible par tous)
-- - private_note = note privée (visible que par toi)
--
-- Test:
-- UPDATE category_notes
-- SET private_note = 'Ma note privée pour cette catégorie'
-- WHERE participant_id = 'xxx' AND category = 'Allahu Ekber';
-- ============================================
