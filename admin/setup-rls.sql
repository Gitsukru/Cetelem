-- ====================================
-- ADMIN DASHBOARD - Configuration RLS
-- ====================================
-- Copiez-collez ce fichier COMPLET dans Supabase SQL Editor
-- Puis cliquez "Run" pour exécuter tout d'un coup
-- ====================================

-- ÉTAPE 1: Activer RLS sur les tables
-- ====================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- ====================================
-- ÉTAPE 2: Supprimer anciennes policies (si elles existent)
-- ====================================

DROP POLICY IF EXISTS "Admin read analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admin read groups" ON groups;
DROP POLICY IF EXISTS "Admin read group_participants" ON group_participants;
DROP POLICY IF EXISTS "Admin delete old groups" ON groups;

-- ====================================
-- ÉTAPE 3: Créer les nouvelles policies
-- ====================================

-- POLICY 1: Admin peut lire analytics_events
CREATE POLICY "Admin read analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
    -- Ajoutez d'autres emails admin ici si besoin
    -- ,'autre-admin@example.com'
  )
);

-- POLICY 2: Admin peut lire groups
CREATE POLICY "Admin read groups"
ON groups
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
  )
);

-- POLICY 3: Admin peut lire group_participants
CREATE POLICY "Admin read group_participants"
ON group_participants
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
  )
);

-- POLICY 4: Admin peut supprimer (pour nettoyage)
CREATE POLICY "Admin delete old groups"
ON groups
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
  )
);

-- ====================================
-- VÉRIFICATION (optionnel)
-- ====================================
-- Vérifiez que RLS est actif :

SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('analytics_events', 'groups', 'group_participants');

-- Vous devriez voir "rowsecurity = true" pour les 3 tables

-- ====================================
-- TERMINÉ !
-- ====================================
-- Votre dashboard admin est maintenant sécurisé
-- Seul votre email admin peut accéder aux données
