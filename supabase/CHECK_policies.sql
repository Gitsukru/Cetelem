-- 🔍 DIAGNOSTIC: Vérifier les politiques RLS actuelles
-- Exécuter dans Supabase Dashboard > SQL Editor

-- 1. Vérifier la politique sur analytics_events
SELECT
  policyname,
  cmd as operation,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'analytics_events'
  AND cmd = 'INSERT';

-- 2. Compter les events dans la dernière heure
SELECT
  COUNT(*) as events_last_hour,
  CASE
    WHEN COUNT(*) >= 1000 THEN '🔴 LIMITE ATTEINTE (1000+)'
    WHEN COUNT(*) >= 500 THEN '⚠️ ATTENTION (500-1000)'
    WHEN COUNT(*) >= 100 THEN '🟡 OK mais ancien limit dépassé (100-500)'
    ELSE '✅ OK (< 100)'
  END as status
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 3. Compter le total d'events
SELECT
  COUNT(*) as total_events,
  MIN(created_at) as oldest_event,
  MAX(created_at) as newest_event
FROM analytics_events;
