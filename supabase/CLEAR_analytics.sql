-- 🧹 NETTOYER analytics_events pour débloquer le 401
-- Exécuter dans Supabase Dashboard > SQL Editor

-- Vider complètement la table analytics_events
DELETE FROM analytics_events;

-- Vérifier que c'est vide
SELECT COUNT(*) as events_restants FROM analytics_events;

-- Test: Insérer un event pour vérifier que ça marche
INSERT INTO analytics_events (event_name, event_data)
VALUES ('test_after_clear', '{"status": "cleared"}'::jsonb)
RETURNING 'Table vidée et fonctionnelle ✅' as result;
