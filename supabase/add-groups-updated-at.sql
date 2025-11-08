-- ============================================================================
-- Ajouter colonne updated_at à la table groups
-- ============================================================================
--
-- Ce script ajoute:
-- 1. Une colonne updated_at à la table groups
-- 2. Un trigger qui met à jour automatiquement updated_at quand un groupe est modifié
-- 3. Initialise updated_at = created_at pour les groupes existants
--
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Ajouter la colonne updated_at
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Initialiser updated_at pour les groupes existants
UPDATE groups
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 3. Créer une fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger sur la table groups
DROP TRIGGER IF EXISTS set_updated_at ON groups;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Vérification
-- ============================================================================

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'groups' AND column_name = 'updated_at';

-- Vérifier que le trigger existe
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'set_updated_at';
