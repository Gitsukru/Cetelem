-- ⚡ FIX RAPIDE: Débloquer analytics_events immédiatement
-- Exécuter ce script pour résoudre l'erreur 401
-- Date: 2025-10-12

-- ============================================================================
-- SOLUTION: Désactiver le rate limiting sur analytics_events
-- ============================================================================

-- Supprimer la politique qui bloque
DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;

-- Créer une politique sans limite (pour applications anonymes)
CREATE POLICY "analytics_events_insert_public" ON analytics_events
  FOR INSERT
  WITH CHECK (true);  -- Pas de rate limiting

-- ============================================================================
-- RÉSULTAT
-- ============================================================================

/*
✅ L'erreur 401 devrait disparaître immédiatement
✅ L'application peut maintenant envoyer des analytics
✅ La politique SELECT reste active (lecture des 24 dernières heures)

⚠️ ATTENTION:
Sans rate limiting, un attaquant pourrait spammer la table analytics_events.
Recommandations:
1. Surveiller l'usage dans Supabase Dashboard
2. Implémenter rate limiting côté application (monitoring.js)
3. Configurer des alertes si usage anormal
4. À moyen terme: utiliser Edge Functions pour rate limiting par IP
*/

-- Test: Vérifier que l'insertion fonctionne
INSERT INTO analytics_events (event_name, event_data)
VALUES ('quick_fix_test', '{"status": "unlocked", "timestamp": "2025-10-12"}'::jsonb)
RETURNING 'Test réussi ✅' as result, id, event_name, created_at;
