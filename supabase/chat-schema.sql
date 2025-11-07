-- ============================================
-- SCHÉMA SUPABASE POUR CHAT GROUPE (VERSION CORRIGÉE)
-- ============================================
-- À exécuter dans le SQL Editor de Supabase
-- Compatible avec groups.id en UUID ou BIGINT
-- ============================================

-- TABLE: GROUP_MESSAGES (Messages de chat)
-- ============================================
-- IMPORTANT: Adapter le type de group_id selon votre table groups existante

-- Vérifier d'abord le type de groups.id:
-- SELECT data_type FROM information_schema.columns
-- WHERE table_name = 'groups' AND column_name = 'id';

-- Si groups.id est UUID, utilisez cette version:
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si groups.id est BIGINT, commentez le CREATE TABLE ci-dessus et décommentez celui-ci:
-- CREATE TABLE IF NOT EXISTS group_messages (
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
--   participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
--   participant_name VARCHAR(255) NOT NULL,
--   message TEXT NOT NULL,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Index pour recherche rapide (par groupe, ordre chronologique)
CREATE INDEX IF NOT EXISTS idx_messages_group_time
  ON group_messages(group_id, created_at DESC);

-- Index pour recherche par participant
CREATE INDEX IF NOT EXISTS idx_messages_participant
  ON group_messages(participant_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- POLICY: Tout le monde peut lire les messages
CREATE POLICY "messages_select_policy" ON group_messages
  FOR SELECT USING (true);

-- POLICY: Tout le monde peut envoyer des messages
CREATE POLICY "messages_insert_policy" ON group_messages
  FOR INSERT WITH CHECK (true);

-- POLICY: Tout le monde peut supprimer (optionnel - pour modération)
CREATE POLICY "messages_delete_policy" ON group_messages
  FOR DELETE USING (true);

-- ============================================
-- REALTIME (Temps réel)
-- ============================================

-- Activer la réplication en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- ============================================
-- CONTRAINTES ADDITIONNELLES
-- ============================================

-- Limiter longueur message (500 caractères)
ALTER TABLE group_messages
  ADD CONSTRAINT check_message_length
  CHECK (char_length(message) > 0 AND char_length(message) <= 500);

-- ============================================
-- FONCTION DE NETTOYAGE (Optionnel)
-- ============================================
-- Nettoyer les vieux messages (garde seulement les 100 derniers par groupe)

CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Pour chaque groupe, supprimer messages au-delà des 100 derniers
  DELETE FROM group_messages m1
  WHERE id IN (
    SELECT id FROM group_messages m2
    WHERE m2.group_id = m1.group_id
    ORDER BY created_at DESC
    OFFSET 100
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifier :

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'group_messages';

-- SELECT * FROM group_messages LIMIT 10;
