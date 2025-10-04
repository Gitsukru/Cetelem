-- ============================================
-- MIGRATION: Ajouter la colonne metadata
-- ============================================
--
-- Cette migration ajoute le support des statistiques
-- détaillées par catégorie pour chaque participant
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- Ajouter la colonne metadata si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'participants'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE participants
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

    RAISE NOTICE 'Colonne metadata ajoutée avec succès';
  ELSE
    RAISE NOTICE 'Colonne metadata existe déjà';
  END IF;
END $$;

-- Créer un index pour les requêtes sur metadata (optionnel mais recommandé)
CREATE INDEX IF NOT EXISTS idx_participants_metadata
  ON participants USING GIN (metadata);

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
--
-- La colonne metadata peut maintenant stocker:
-- {
--   "categories": {
--     "Subhan Allah": {"today": 100, "week": 500, "month": 2000},
--     "Elhamdulillah": {"today": 50, "week": 300, "month": 1000}
--   },
--   "lastUpdated": "2025-10-04T12:34:56Z"
-- }
--
-- ============================================
