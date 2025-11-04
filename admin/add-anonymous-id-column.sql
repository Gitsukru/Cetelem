-- ====================================
-- AJOUTER COLONNE anonymous_id
-- ====================================
-- Ajoute la colonne manquante pour PrivacyAnalytics
-- ====================================

-- Ajouter la colonne anonymous_id (si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'analytics_events'
    AND column_name = 'anonymous_id'
  ) THEN
    ALTER TABLE analytics_events
    ADD COLUMN anonymous_id TEXT;

    RAISE NOTICE '✅ Colonne anonymous_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne anonymous_id existe déjà';
  END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_analytics_anonymous_id
ON analytics_events(anonymous_id);

-- Créer un index pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_analytics_created_at
ON analytics_events(created_at DESC);

-- Vérifier la structure de la table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analytics_events'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ====================================
-- TERMINÉ !
-- ====================================
-- Exécutez ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Coller et RUN
-- ====================================
