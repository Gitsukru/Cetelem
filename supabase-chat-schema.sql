-- ============================================
-- SCHÉMA SUPABASE POUR CHAT GROUPE
-- ============================================
-- À exécuter dans le SQL Editor de Supabase
-- APRÈS avoir exécuté supabase-schema.sql
-- ============================================

-- TABLE: GROUP_MESSAGES (Messages de chat)
-- ============================================
CREATE TABLE IF NOT EXISTS group_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL, -- Nom affiché (dénormalisé pour performance)
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide (par groupe, ordre chronologique)
CREATE INDEX IF NOT EXISTS idx_messages_group_time
  ON group_messages(group_id, created_at DESC);

-- Index pour recherche par participant
CREATE INDEX IF NOT EXISTS idx_messages_participant
  ON group_messages(participant_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Sécurité : tout le monde peut lire/écrire dans son groupe

-- Activer RLS
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- POLICY: Tout le monde peut lire les messages de son groupe
CREATE POLICY "messages_select_policy" ON group_messages
  FOR SELECT USING (true);

-- POLICY: Tout le monde peut envoyer des messages
CREATE POLICY "messages_insert_policy" ON group_messages
  FOR INSERT WITH CHECK (true);

-- POLICY: Seulement l'auteur peut supprimer son message (optionnel)
CREATE POLICY "messages_delete_own_policy" ON group_messages
  FOR DELETE USING (true);

-- ============================================
-- REALTIME (Temps réel)
-- ============================================
-- Activer la réplication en temps réel pour les messages

ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- ============================================
-- FONCTION DE NETTOYAGE (Optionnel)
-- ============================================
-- Nettoyer les vieux messages (garde seulement les 100 derniers par groupe)

CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Pour chaque groupe, garder seulement les 100 derniers messages
  DELETE FROM group_messages
  WHERE id NOT IN (
    SELECT id FROM group_messages
    WHERE group_id = group_messages.group_id
    ORDER BY created_at DESC
    LIMIT 100
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CONTRAINTES ADDITIONNELLES (Optionnel)
-- ============================================

-- Limiter longueur message (500 caractères)
ALTER TABLE group_messages
  ADD CONSTRAINT check_message_length
  CHECK (char_length(message) > 0 AND char_length(message) <= 500);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifier que tout est créé :

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name = 'group_messages';

-- SELECT * FROM group_messages LIMIT 10;
