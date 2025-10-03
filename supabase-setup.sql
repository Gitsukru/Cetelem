-- ============================================
-- CONFIGURATION SUPABASE POUR ZIKIRMATIK
-- ============================================
--
-- Ce script crée toutes les tables nécessaires
-- pour le système de groupe en temps réel
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. CRÉER LA TABLE DES GROUPES
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: code doit être en majuscules
  CONSTRAINT code_uppercase CHECK (code = UPPER(code))
);

-- 2. CRÉER LA TABLE DES PARTICIPANTS
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  today_count INTEGER DEFAULT 0 CHECK (today_count >= 0),
  week_count INTEGER DEFAULT 0 CHECK (week_count >= 0),
  month_count INTEGER DEFAULT 0 CHECK (month_count >= 0),
  total_count INTEGER DEFAULT 0 CHECK (total_count >= 0),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: un nom unique par groupe
  UNIQUE(group_id, name)
);

-- 3. CRÉER LES INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_participants_group_id
  ON participants(group_id);

CREATE INDEX IF NOT EXISTS idx_participants_today_count
  ON participants(today_count DESC);

CREATE INDEX IF NOT EXISTS idx_groups_code
  ON groups(code);

-- 4. CRÉER UNE FONCTION POUR AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CRÉER LE TRIGGER SUR participants
DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. ACTIVER LE TEMPS RÉEL (REALTIME)
-- IMPORTANT: Sans ça, pas de mises à jour en temps réel !
-- Note: Si erreur "already member", c'est normal, la table est déjà en temps réel
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE participants;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore si déjà ajouté
END $$;

-- 7. CONFIGURER ROW LEVEL SECURITY (RLS)
-- Pour l'instant, on autorise tout (mode développement)
-- Tu pourras restreindre plus tard si besoin

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les groupes
DO $$
BEGIN
  CREATE POLICY "Lecture publique des groupes"
    ON groups FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Politique: Tout le monde peut créer un groupe
DO $$
BEGIN
  CREATE POLICY "Création publique des groupes"
    ON groups FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Politique: Tout le monde peut lire les participants
DO $$
BEGIN
  CREATE POLICY "Lecture publique des participants"
    ON participants FOR SELECT
    TO authenticated, anon
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Politique: Tout le monde peut rejoindre un groupe
DO $$
BEGIN
  CREATE POLICY "Insertion publique des participants"
    ON participants FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Politique: Tout le monde peut mettre à jour son score
DO $$
BEGIN
  CREATE POLICY "Mise à jour publique des participants"
    ON participants FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Politique: Tout le monde peut quitter un groupe
DO $$
BEGIN
  CREATE POLICY "Suppression publique des participants"
    ON participants FOR DELETE
    TO authenticated, anon
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 8. CRÉER UNE VUE POUR LE CLASSEMENT (BONUS)
DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id,
  p.group_id,
  p.name,
  p.today_count,
  p.week_count,
  p.month_count,
  p.total_count,
  p.updated_at,
  g.code as group_code,
  g.name as group_name,
  -- Calculer les points (formule: today*10 + week*2 + month*1 + total/10)
  (p.today_count * 10 + p.week_count * 2 + p.month_count * 1 + FLOOR(p.total_count / 10)) as points,
  -- Rang dans le groupe
  ROW_NUMBER() OVER (PARTITION BY p.group_id ORDER BY p.today_count DESC) as rank_in_group
FROM participants p
JOIN groups g ON p.group_id = g.id
ORDER BY p.group_id, p.today_count DESC;

-- 9. VÉRIFICATION - TESTER LES TABLES
-- Décommenter pour tester après la création

-- INSERT INTO groups (code, name) VALUES ('TEST01', 'Groupe Test');
-- INSERT INTO participants (group_id, name, today_count)
-- SELECT id, 'Ahmed', 100 FROM groups WHERE code = 'TEST01';
-- SELECT * FROM leaderboard_view;

-- ============================================
-- CONFIGURATION TERMINÉE ! ✅
-- ============================================
--
-- Prochaines étapes:
-- 1. Copie ton Project URL et anon key
-- 2. Colle-les dans src/config/backend.config.js
-- 3. Teste la création d'un groupe dans l'app
--
-- ============================================

-- COMMANDES UTILES POUR DEBUG
--
-- Voir tous les groupes:
-- SELECT * FROM groups;
--
-- Voir tous les participants:
-- SELECT * FROM participants;
--
-- Voir le classement:
-- SELECT * FROM leaderboard_view;
--
-- Supprimer un groupe (cascade = supprime les participants):
-- DELETE FROM groups WHERE code = 'ABC123';
--
-- Réinitialiser toutes les données:
-- TRUNCATE groups CASCADE;
-- ============================================
