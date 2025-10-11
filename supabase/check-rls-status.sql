-- 🔍 Script de diagnostic RLS
-- Vérifie l'état des tables et politiques RLS
-- À exécuter dans Supabase Dashboard > SQL Editor

-- ============================================================================
-- 1. VÉRIFIER SI RLS EST ACTIVÉ SUR TOUTES LES TABLES
-- ============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
ORDER BY tablename;

-- ============================================================================
-- 2. LISTER TOUTES LES POLITIQUES RLS
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. COMPTER LES POLITIQUES PAR TABLE
-- ============================================================================

SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. VÉRIFIER LES POLITIQUES MANQUANTES
-- ============================================================================

-- Expected policies:
-- groups: 2 (select_all, insert_all)
-- participants: 4 (select_all, insert_all, update_all, delete_all)
-- device_backups: 2 (insert_all, select_own)
-- analytics_events: 1 (insert_all)
-- analytics_summary: 1 (select_all)
-- category_notes: 4 (select_all, insert_all, update_all, delete_all)

-- ============================================================================
-- 5. TESTER L'ACCÈS ANONYME
-- ============================================================================

-- Test 1: SELECT sur groups (devrait retourner des résultats)
SELECT COUNT(*) as group_count FROM groups;

-- Test 2: SELECT sur participants (devrait retourner des résultats)
SELECT COUNT(*) as participant_count FROM participants;

-- Test 3: SELECT sur analytics_events (devrait échouer - pas de policy SELECT)
-- SELECT COUNT(*) FROM analytics_events;  -- Commenté car va échouer

-- ============================================================================
-- 📝 RÉSULTATS ATTENDUS
-- ============================================================================

/*
Si tout est correct, vous devriez voir:

1. RLS activé (rls_enabled = true) sur toutes les 6 tables
2. Nombre de politiques par table:
   - groups: 2
   - participants: 4
   - device_backups: 2
   - analytics_events: 1
   - analytics_summary: 1
   - category_notes: 4

3. Les tests SELECT devraient fonctionner pour groups et participants

Si ce n'est pas le cas, réexécutez rls-policies.sql
*/
