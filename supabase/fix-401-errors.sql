-- 🔧 Script de réparation pour erreurs 401
-- Réapplique les politiques RLS essentielles
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ============================================================================
-- RÉPARATION 1: S'assurer que RLS est activé
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RÉPARATION 2: Supprimer les politiques existantes (éviter les doublons)
-- ============================================================================

-- groups
DROP POLICY IF EXISTS "groups_select_all" ON groups;
DROP POLICY IF EXISTS "groups_insert_all" ON groups;

-- participants
DROP POLICY IF EXISTS "participants_select_all" ON participants;
DROP POLICY IF EXISTS "participants_insert_all" ON participants;
DROP POLICY IF EXISTS "participants_update_all" ON participants;
DROP POLICY IF EXISTS "participants_delete_all" ON participants;

-- analytics_events
DROP POLICY IF EXISTS "analytics_events_insert_all" ON analytics_events;

-- analytics_summary
DROP POLICY IF EXISTS "analytics_summary_select_all" ON analytics_summary;

-- ============================================================================
-- RÉPARATION 3: Recréer les politiques ESSENTIELLES
-- ============================================================================

-- GROUPS: Lecture et création publiques
CREATE POLICY "groups_select_all" ON groups
  FOR SELECT
  USING (true);

CREATE POLICY "groups_insert_all" ON groups
  FOR INSERT
  WITH CHECK (true);

-- PARTICIPANTS: Toutes opérations publiques (app anonyme)
CREATE POLICY "participants_select_all" ON participants
  FOR SELECT
  USING (true);

CREATE POLICY "participants_insert_all" ON participants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "participants_update_all" ON participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "participants_delete_all" ON participants
  FOR DELETE
  USING (true);

-- ANALYTICS_EVENTS: Insertion publique (tracking anonyme)
CREATE POLICY "analytics_events_insert_all" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- ANALYTICS_SUMMARY: Lecture publique (dashboard)
CREATE POLICY "analytics_summary_select_all" ON analytics_summary
  FOR SELECT
  USING (true);

-- ============================================================================
-- ✅ VÉRIFICATION
-- ============================================================================

-- Afficher toutes les politiques créées
SELECT
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'analytics_events', 'analytics_summary')
ORDER BY tablename, policyname;

-- ============================================================================
-- 🧪 TEST
-- ============================================================================

-- Test 1: Lire groups (devrait fonctionner)
SELECT 'Test groups SELECT:' as test, COUNT(*) as result FROM groups;

-- Test 2: Lire participants (devrait fonctionner)
SELECT 'Test participants SELECT:' as test, COUNT(*) as result FROM participants;

-- Test 3: Insérer dans analytics_events (devrait fonctionner)
INSERT INTO analytics_events (event_name, event_data)
VALUES ('test_event', '{"source": "rls_fix_script"}'::jsonb)
RETURNING 'Test analytics_events INSERT:' as test, id;

-- ============================================================================
-- 📝 RÉSULTAT ATTENDU
-- ============================================================================

/*
Après exécution, vous devriez voir:
1. RLS activé sur toutes les tables
2. Politiques créées (6 au total pour groups + participants + analytics)
3. Les 3 tests devraient réussir

Les erreurs 401 devraient disparaître après rafraîchissement de l'app.
*/
