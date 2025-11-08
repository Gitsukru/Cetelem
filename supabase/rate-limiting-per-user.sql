-- ============================================================================
-- Rate Limiting par utilisateur/device pour 10k users
-- ============================================================================
--
-- Prérequis: Exécuter add-device-id-tracking.sql AVANT ce fichier
--
-- Protection contre abus:
-- - Limite créations groupes par device (5/jour)
-- - Limite analytics par device (500/jour)
--
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Fonction de vérification rate limit groupes
CREATE OR REPLACE FUNCTION check_group_rate_limit(
    p_device_id TEXT,
    p_limit INTEGER DEFAULT 5,
    p_period_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    group_count INTEGER;
BEGIN
    -- Si pas de device_id, refuser
    IF p_device_id IS NULL OR p_device_id = '' THEN
        RETURN false;
    END IF;

    -- Compter groupes créés par ce device
    SELECT COUNT(*)
    INTO group_count
    FROM groups
    WHERE created_by_device = p_device_id
      AND created_at > NOW() - (p_period_hours || ' hours')::INTERVAL;

    -- Retourner true si limite non atteinte
    RETURN group_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction de vérification rate limit analytics
CREATE OR REPLACE FUNCTION check_analytics_rate_limit(
    p_device_id TEXT,
    p_limit INTEGER DEFAULT 500,
    p_period_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    event_count INTEGER;
BEGIN
    -- Si pas de device_id, accepter en mode dégradé
    IF p_device_id IS NULL OR p_device_id = '' THEN
        RETURN true;
    END IF;

    -- Compter events par ce device
    SELECT COUNT(*)
    INTO event_count
    FROM analytics_events
    WHERE device_id = p_device_id
      AND created_at > NOW() - (p_period_hours || ' hours')::INTERVAL;

    -- Retourner true si limite non atteinte
    RETURN event_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mettre à jour politique RLS groupes avec rate limit device
-- Garde limite globale + ajoute limite par device
DROP POLICY IF EXISTS "groups_insert_scaled" ON groups;

CREATE POLICY "groups_insert_scaled" ON groups
    FOR INSERT
    WITH CHECK (
        -- Limite globale (500/h pour tous users)
        (SELECT COUNT(*) FROM groups WHERE created_at > NOW() - INTERVAL '1 hour') < 500
        AND
        -- Limite par device (5/jour) - accepter si NULL pour compatibilité
        (created_by_device IS NULL OR check_group_rate_limit(created_by_device, 5, 24))
    );

-- 4. Mettre à jour politique RLS analytics avec rate limit device
DROP POLICY IF EXISTS "analytics_events_insert_scaled" ON analytics_events;

CREATE POLICY "analytics_events_insert_scaled" ON analytics_events
    FOR INSERT
    WITH CHECK (
        -- Limite globale (5000/h)
        (SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL '1 hour') < 5000
        AND
        -- Limite par device (500/jour) - accepter si NULL
        (device_id IS NULL OR check_analytics_rate_limit(device_id, 500, 24))
    );

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Vérifier fonctions créées
SELECT
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('check_group_rate_limit', 'check_analytics_rate_limit');

-- Vérifier policies actives
SELECT
    schemaname,
    tablename,
    policyname,
    qual as check_condition
FROM pg_policies
WHERE policyname LIKE '%scaled%'
ORDER BY tablename, policyname;

-- Tester fonction rate limit groupes (devrait retourner true si <5 groupes)
SELECT check_group_rate_limit('test_device_123', 5, 24) as can_create_group;

-- Tester fonction rate limit analytics (devrait retourner true si <500 events)
SELECT check_analytics_rate_limit('test_device_123', 500, 24) as can_track_analytics;

-- ============================================================================
-- Tests et monitoring
-- ============================================================================

/*
-- Compter groupes par device (top 10 devices les plus actifs)
SELECT
    created_by_device,
    COUNT(*) as groups_created,
    MIN(created_at) as first_group,
    MAX(created_at) as last_group
FROM groups
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND created_by_device IS NOT NULL
GROUP BY created_by_device
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Compter analytics par device (top 10 devices les plus actifs)
SELECT
    device_id,
    COUNT(*) as events_tracked,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event,
    array_agg(DISTINCT event_name) as event_types
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND device_id IS NOT NULL
GROUP BY device_id
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Vérifier si un device spécifique atteint la limite
SELECT
    'test_device_id' as device_id,
    COUNT(*) as groups_last_24h,
    check_group_rate_limit('test_device_id', 5, 24) as can_still_create
FROM groups
WHERE created_by_device = 'test_device_id'
  AND created_at > NOW() - INTERVAL '24 hours';
*/

-- ============================================================================
-- Notes d'utilisation
-- ============================================================================

/*
Limites configurées:
- Groupes: 5 par device/jour + 500 global/heure
- Analytics: 500 par device/jour + 5000 global/heure

Pour ajuster les limites, modifier les valeurs dans les policies:
- check_group_rate_limit(device_id, LIMITE, HEURES)
- check_analytics_rate_limit(device_id, LIMITE, HEURES)

⚠️ IMPORTANT:
- device_id doit être passé par le client dans les INSERT
- Code client déjà mis à jour (analytics.js, SupabaseProvider.js)
- Si device_id NULL dans groupes: policy accepte (compatibilité anciennes données)
- Si device_id NULL dans analytics: policy accepte (mode dégradé)

Performance:
- Fonctions utilisent index existants (idx_groups_device_created, etc)
- Pas de table supplémentaire = pas de JOIN
- Vérification en temps réel à chaque INSERT
- COUNT(*) optimisé par index sur created_at + device_id

Monitoring:
- Utiliser les requêtes SQL dans section "Tests et monitoring" ci-dessus
- Surveiller devices qui créent >4 groupes/jour (proche limite)
- Surveiller devices qui track >400 events/jour (proche limite)
*/
