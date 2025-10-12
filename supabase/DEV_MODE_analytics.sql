-- 🛠️ MODE DÉVELOPPEMENT: Augmenter limite rate limiting
-- Pour permettre le développement tranquille avec plusieurs appareils
-- Date: 2025-10-12

-- ============================================================================
-- PROBLÈME ACTUEL
-- ============================================================================
/*
Limite actuelle: 100 events/heure GLOBAL
Avec monitoring.js + 2-3 appareils de dev → Limite atteinte rapidement
Résultat: Erreurs 401 même en développement

Solution: Augmenter à 1000 events/heure pour le développement
*/

-- ============================================================================
-- SOLUTION: Augmenter la limite pour développement
-- ============================================================================

-- Supprimer la politique restrictive actuelle
DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;

-- Créer nouvelle politique avec limite plus élevée pour développement
CREATE POLICY "analytics_events_insert_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 1000  -- 1000 au lieu de 100 (10x plus large pour dev)
  );

-- ============================================================================
-- RÉSULTAT
-- ============================================================================

/*
✅ Plus d'erreurs 401 pendant le développement
✅ Protection basique maintenue (pas de spam infini)
✅ Large pour dev avec plusieurs appareils (2-10 appareils OK)
✅ Monitoring désactivé donc usage réel: ~50-100 events/h max

USAGE ESTIMÉ EN DEV:
- 3 appareils × 10 events/h = 30 events/h
- Marge: 1000 - 30 = 970 events/h disponibles
- Largement suffisant! ✅

AVANT LANCEMENT PUBLIC:
Possibilité de réajuster à 500 ou garder 1000 selon analytics réels
*/

-- Test: Vérifier que l'insertion fonctionne
INSERT INTO analytics_events (event_name, event_data)
VALUES ('dev_mode_test', '{"status": "rate_limit_increased", "new_limit": 1000}'::jsonb)
RETURNING 'Test réussi ✅' as result, id, event_name, created_at;

-- Vérifier la politique créée
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'analytics_events'
  AND policyname = 'analytics_events_insert_rate_limited';
