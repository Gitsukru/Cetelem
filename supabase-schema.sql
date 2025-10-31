-- ============================================
-- SCHÉMA SUPABASE POUR ZIKIRMATIK
-- ============================================
-- Ce fichier contient toutes les tables nécessaires
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- TABLE 1: GROUPS (Groupes de zikir)
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(6) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);

-- TABLE 2: PARTICIPANTS (Membres des groupes)
-- ============================================
CREATE TABLE IF NOT EXISTS participants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  today_count INTEGER DEFAULT 0,
  week_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte : nom unique par groupe
  UNIQUE(group_id, name)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON participants(group_id);
CREATE INDEX IF NOT EXISTS idx_participants_updated_at ON participants(updated_at);

-- TABLE 3: CATEGORY_NOTES (Notes publiques par catégorie)
-- ============================================
CREATE TABLE IF NOT EXISTS category_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : une seule note par participant/groupe/catégorie
  UNIQUE(group_id, participant_id, category)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_category_notes_group_category ON category_notes(group_id, category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Sécurité : tout le monde peut lire, tout le monde peut écrire
-- (Pas d'authentification utilisateur, système basé sur codes de groupe)

-- Activer RLS sur toutes les tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_notes ENABLE ROW LEVEL SECURITY;

-- POLICIES POUR GROUPS
-- Tout le monde peut lire les groupes (pour vérifier les codes)
CREATE POLICY "groups_select_policy" ON groups
  FOR SELECT USING (true);

-- Tout le monde peut créer des groupes
CREATE POLICY "groups_insert_policy" ON groups
  FOR INSERT WITH CHECK (true);

-- POLICIES POUR PARTICIPANTS
-- Tout le monde peut lire les participants
CREATE POLICY "participants_select_policy" ON participants
  FOR SELECT USING (true);

-- Tout le monde peut créer des participants (rejoindre un groupe)
CREATE POLICY "participants_insert_policy" ON participants
  FOR INSERT WITH CHECK (true);

-- Tout le monde peut mettre à jour les participants (scores)
CREATE POLICY "participants_update_policy" ON participants
  FOR UPDATE USING (true);

-- POLICIES POUR CATEGORY_NOTES
-- Tout le monde peut lire les notes
CREATE POLICY "category_notes_select_policy" ON category_notes
  FOR SELECT USING (true);

-- Tout le monde peut créer des notes
CREATE POLICY "category_notes_insert_policy" ON category_notes
  FOR INSERT WITH CHECK (true);

-- Tout le monde peut mettre à jour les notes
CREATE POLICY "category_notes_update_policy" ON category_notes
  FOR UPDATE USING (true);

-- Tout le monde peut supprimer des notes
CREATE POLICY "category_notes_delete_policy" ON category_notes
  FOR DELETE USING (true);

-- ============================================
-- REALTIME (Temps réel)
-- ============================================
-- Activer la réplication en temps réel pour les mises à jour

ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE category_notes;

-- ============================================
-- FONCTION DE NETTOYAGE (Optionnel)
-- ============================================
-- Nettoyer les vieux groupes inactifs (plus de 30 jours)

CREATE OR REPLACE FUNCTION cleanup_old_groups()
RETURNS void AS $$
BEGIN
  DELETE FROM groups
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM participants
      WHERE participants.group_id = groups.id
        AND participants.updated_at > NOW() - INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifier que tout est créé :

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('groups', 'participants', 'category_notes');
