-- 🔧 FIX URGENT: 401 sur analytics_events
-- Problème: Rate limiting trop strict bloque toutes les insertions
-- Date: 2025-10-12

-- ============================================================================
-- DIAGNOSTIC: Vérifier combien d'events dans la dernière heure
-- ============================================================================

SELECT
  'Events dernière heure' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 100 THEN '❌ BLOQUÉ (>= 100)'
    ELSE '✅ OK (< 100)'
  END as status
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '1 hour';

-- ============================================================================
-- SOLUTION 1: Augmenter la limite temporairement (RAPIDE)
-- ============================================================================

-- Supprimer la politique rate-limited actuelle
DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;

-- Créer nouvelle politique avec limite plus élevée (500/h au lieu de 100/h)
CREATE POLICY "analytics_events_insert_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 500  -- Augmenté à 500 pour éviter blocage
  );

-- ============================================================================
-- SOLUTION 2: Désactiver temporairement le rate limiting (DÉVELOPPEMENT)
-- ============================================================================

-- Décommenter cette section pour désactiver complètement le rate limiting:
--
-- DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;
--
-- CREATE POLICY "analytics_events_insert_unlimited" ON analytics_events
--   FOR INSERT
--   WITH CHECK (true);  -- Pas de limite

-- ============================================================================
-- VÉRIFICATION: Tester insertion
-- ============================================================================

-- Tester si on peut maintenant insérer
INSERT INTO analytics_events (event_name, event_data)
VALUES ('test_insert', '{"source": "fix_script", "timestamp": "2025-10-12"}'::jsonb)
RETURNING 'Test insertion:' as result, id, event_name, created_at;

-- Si l'insertion ci-dessus réussit, le problème est résolu ✅

-- ============================================================================
-- NETTOYAGE: Supprimer les vieux analytics (optionnel)
-- ============================================================================

-- Décommenter pour supprimer les events de plus de 7 jours:
--
-- DELETE FROM analytics_events
-- WHERE created_at < NOW() - INTERVAL '7 days';

-- Vérifier combien restent après nettoyage
SELECT
  'Total events après nettoyage' as info,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as events_last_hour
FROM analytics_events;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

/*
Après exécution:

1. Si "Events dernière heure" < 500 → Insertions débloquées ✅
2. Si test_insert réussit → Politique fonctionne ✅
3. Application peut maintenant envoyer analytics ✅

IMPORTANT:
- Limite augmentée à 500/h pour éviter blocages en développement
- En production, surveiller avec monitoring Supabase
- Ajuster limite selon usage réel (100-1000/h)
*/
