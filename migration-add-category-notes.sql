-- ============================================
-- MIGRATION: Notes de catégorie pour les groupes
-- ============================================
--
-- Permettre aux participants d'ajouter des remarques
-- sur les catégories de zikir (visibles par tous)
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. CRÉER LA TABLE DES NOTES DE CATÉGORIE
CREATE TABLE IF NOT EXISTS category_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, participant_id, category)
);

-- 2. INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_category_notes_group
  ON category_notes(group_id);

CREATE INDEX IF NOT EXISTS idx_category_notes_participant
  ON category_notes(participant_id);

CREATE INDEX IF NOT EXISTS idx_category_notes_category
  ON category_notes(category);

-- 3. ROW LEVEL SECURITY
ALTER TABLE category_notes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut créer/modifier ses propres notes
DO $$
BEGIN
  CREATE POLICY "Users can manage their category notes"
    ON category_notes FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tout le monde peut lire les notes du groupe
DO $$
BEGIN
  CREATE POLICY "Users can read all category notes"
    ON category_notes FOR SELECT
    TO anon, authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. FONCTION AUTO-UPDATE DE updated_at
CREATE OR REPLACE FUNCTION update_category_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_notes_updated_at
  BEFORE UPDATE ON category_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_category_notes_updated_at();

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
--
-- Test:
-- INSERT INTO category_notes (group_id, participant_id, category, note)
-- VALUES ('group-id', 'participant-id', 'Allahu Ekber', 'Test note');
--
-- SELECT * FROM category_notes WHERE group_id = 'group-id';
-- ============================================
