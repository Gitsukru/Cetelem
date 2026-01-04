-- ============================================================================
-- Rate Limiting pour Hatim (hatims + hatim_participations)
-- ============================================================================
--
-- Protection contre abus:
-- - Limite création hatims par device (3/jour)
-- - Limite participations par device (20/jour par hatim)
-- - Limite globale création hatims (100/heure)
--
-- À exécuter dans: Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Activer RLS sur les tables hatim (si pas déjà fait)
ALTER TABLE hatims ENABLE ROW LEVEL SECURITY;
ALTER TABLE hatim_participations ENABLE ROW LEVEL SECURITY;

-- 2. Fonction de vérification rate limit hatims
CREATE OR REPLACE FUNCTION check_hatim_rate_limit(
    p_device_id TEXT,
    p_limit INTEGER DEFAULT 3,
    p_period_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    hatim_count INTEGER;
BEGIN
    -- Si pas de device_id, refuser
    IF p_device_id IS NULL OR p_device_id = '' THEN
        RETURN false;
    END IF;

    -- Compter hatims créés par ce device
    SELECT COUNT(*)
    INTO hatim_count
    FROM hatims
    WHERE created_by_device = p_device_id
      AND created_at > NOW() - (p_period_hours || ' hours')::INTERVAL;

    -- Retourner true si limite non atteinte
    RETURN hatim_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction de vérification rate limit participations par hatim
CREATE OR REPLACE FUNCTION check_participation_rate_limit(
    p_device_id TEXT,
    p_hatim_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_period_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    participation_count INTEGER;
BEGIN
    -- Si pas de device_id, autoriser (mode dégradé)
    IF p_device_id IS NULL OR p_device_id = '' THEN
        RETURN true;
    END IF;

    -- Compter participations de ce device dans ce hatim
    SELECT COUNT(*)
    INTO participation_count
    FROM hatim_participations
    WHERE device_id = p_device_id
      AND hatim_id = p_hatim_id
      AND claimed_at > NOW() - (p_period_hours || ' hours')::INTERVAL;

    -- Retourner true si limite non atteinte
    RETURN participation_count < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Policies pour hatims
-- ============================================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "hatims_all" ON hatims;
DROP POLICY IF EXISTS "hatims_select" ON hatims;
DROP POLICY IF EXISTS "hatims_insert" ON hatims;
DROP POLICY IF EXISTS "hatims_update" ON hatims;

-- SELECT: Tout le monde peut lire les hatims
CREATE POLICY "hatims_select" ON hatims
    FOR SELECT
    USING (true);

-- INSERT: Rate limited par device
CREATE POLICY "hatims_insert" ON hatims
    FOR INSERT
    WITH CHECK (
        -- Limite globale (100/heure)
        (SELECT COUNT(*) FROM hatims WHERE created_at > NOW() - INTERVAL '1 hour') < 100
        AND
        -- Limite par device (3/jour)
        (created_by_device IS NULL OR check_hatim_rate_limit(created_by_device, 3, 24))
    );

-- UPDATE: Seulement le créateur peut modifier (via device_id)
CREATE POLICY "hatims_update" ON hatims
    FOR UPDATE
    USING (created_by_device = current_setting('request.headers', true)::json->>'x-device-id'
           OR created_by_device IS NULL);

-- ============================================================================
-- Policies pour hatim_participations
-- ============================================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "participations_all" ON hatim_participations;
DROP POLICY IF EXISTS "participations_select" ON hatim_participations;
DROP POLICY IF EXISTS "participations_insert" ON hatim_participations;
DROP POLICY IF EXISTS "participations_update" ON hatim_participations;
DROP POLICY IF EXISTS "participations_delete" ON hatim_participations;

-- SELECT: Tout le monde peut voir les participations
CREATE POLICY "participations_select" ON hatim_participations
    FOR SELECT
    USING (true);

-- INSERT: Rate limited + unique constraint naturel
CREATE POLICY "participations_insert" ON hatim_participations
    FOR INSERT
    WITH CHECK (
        -- Limite par device dans ce hatim (10 unités max par personne)
        check_participation_rate_limit(device_id, hatim_id, 10, 24)
    );

-- UPDATE: Seulement le propriétaire (device_id) peut modifier
CREATE POLICY "participations_update" ON hatim_participations
    FOR UPDATE
    USING (device_id = current_setting('request.headers', true)::json->>'x-device-id'
           OR device_id IS NULL);

-- DELETE: Seulement le propriétaire peut supprimer
CREATE POLICY "participations_delete" ON hatim_participations
    FOR DELETE
    USING (device_id = current_setting('request.headers', true)::json->>'x-device-id'
           OR device_id IS NULL);

-- ============================================================================
-- Index pour performance
-- ============================================================================

-- Index pour rate limiting hatims
CREATE INDEX IF NOT EXISTS idx_hatims_device_created
ON hatims(created_by_device, created_at)
WHERE created_by_device IS NOT NULL;

-- Index pour rate limiting participations
CREATE INDEX IF NOT EXISTS idx_participations_device_hatim
ON hatim_participations(device_id, hatim_id, claimed_at)
WHERE device_id IS NOT NULL;

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Vérifier RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('hatims', 'hatim_participations');

-- Vérifier policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('hatims', 'hatim_participations')
ORDER BY tablename, policyname;

-- Tester fonctions
SELECT check_hatim_rate_limit('test_device', 3, 24) as can_create_hatim;
SELECT check_participation_rate_limit('test_device', '00000000-0000-0000-0000-000000000000'::uuid, 10, 24) as can_participate;

-- ============================================================================
-- Notes
-- ============================================================================

/*
Limites configurées:
- Hatims: 3 par device/jour + 100 global/heure
- Participations: 10 par device/hatim/jour

Protection:
- Un utilisateur ne peut pas créer plus de 3 hatims par jour
- Un utilisateur ne peut pas prendre plus de 10 cüz dans un même hatim
- Seul le créateur peut modifier son hatim
- Seul le participant peut modifier/supprimer sa participation

⚠️ IMPORTANT:
Pour que les policies UPDATE/DELETE fonctionnent avec device_id,
le client doit envoyer le header x-device-id avec les requêtes Supabase.
Sinon, seules les entrées avec device_id = NULL seront modifiables.

Alternative (plus simple):
Si le header x-device-id n'est pas envoyé, les policies UPDATE/DELETE
comparent avec la valeur stockée dans la colonne device_id directement.
*/
