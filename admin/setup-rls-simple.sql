-- ====================================
-- ADMIN DASHBOARD - Configuration RLS (SIMPLIFIÉ)
-- ====================================
-- Version pour tables existantes uniquement
-- ====================================

-- ÉTAPE 1: Activer RLS sur les tables EXISTANTES
-- ====================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ====================================
-- ÉTAPE 2: Supprimer anciennes policies (si elles existent)
-- ====================================

DROP POLICY IF EXISTS "Admin read analytics" ON analytics_events;
DROP POLICY IF EXISTS "Admin read groups" ON groups;
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

-- POLICY 3: Admin peut supprimer groups (pour nettoyage)
CREATE POLICY "Admin delete old groups"
ON groups
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
  )
);

-- POLICY 4: Admin peut insérer dans analytics_events (pour logs admin)
CREATE POLICY "Admin insert analytics"
ON analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'your-admin-email@example.com'
  )
);

-- ====================================
-- VÉRIFICATION
-- ====================================

SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Active"
FROM pg_tables
WHERE tablename IN ('analytics_events', 'groups')
AND schemaname = 'public';

-- ====================================
-- TERMINÉ !
-- ====================================
-- RLS configuré sur analytics_events et groups
-- Seul your-admin-email@example.com peut accéder aux données
