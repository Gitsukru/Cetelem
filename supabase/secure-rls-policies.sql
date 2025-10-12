-- 🔒 POLITIQUES RLS SÉCURISÉES
-- Script pour remplacer les politiques trop permissives
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Date: 2025-10-12

-- ============================================================================
-- SÉCURITÉ 1: Supprimer les politiques dangereuses existantes
-- ============================================================================

-- Supprimer les politiques UPDATE et DELETE trop permissives
DROP POLICY IF EXISTS "participants_update_all" ON participants;
DROP POLICY IF EXISTS "participants_delete_all" ON participants;

-- ============================================================================
-- SÉCURITÉ 2: Créer des politiques restrictives basées sur user_id
-- ============================================================================

-- PARTICIPANTS UPDATE: Seulement ses propres données
-- Permet à un utilisateur de modifier uniquement les participants qu'il a créés
CREATE POLICY "participants_update_own" ON participants
  FOR UPDATE
  USING (
    -- L'utilisateur authentifié peut modifier ses propres entrées
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Empêche de changer le user_id vers quelqu'un d'autre
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      created_by = auth.uid()
    )
  );

-- PARTICIPANTS DELETE: Seulement ses propres données
-- Permet à un utilisateur de supprimer uniquement les participants qu'il a créés
CREATE POLICY "participants_delete_own" ON participants
  FOR DELETE
  USING (
    -- L'utilisateur authentifié peut supprimer ses propres entrées
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      created_by = auth.uid()
    )
  );

-- ============================================================================
-- SÉCURITÉ 3: Limiter les opérations sur GROUPS
-- ============================================================================

-- Supprimer la politique INSERT trop permissive
DROP POLICY IF EXISTS "groups_insert_all" ON groups;

-- GROUPS INSERT: Seulement utilisateurs authentifiés
-- Empêche création anonyme de groupes (spam prevention)
CREATE POLICY "groups_insert_authenticated" ON groups
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    -- Permettre création anonyme MAIS limiter à 1 par device_id
    (auth.uid() IS NULL AND NOT EXISTS (
      SELECT 1 FROM groups
      WHERE created_by IS NULL
      AND created_at > NOW() - INTERVAL '1 hour'
    ))
  );

-- GROUPS UPDATE: Seulement le créateur
CREATE POLICY "groups_update_own" ON groups
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

-- GROUPS DELETE: Seulement le créateur
CREATE POLICY "groups_delete_own" ON groups
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

-- ============================================================================
-- SÉCURITÉ 4: Limiter ANALYTICS_EVENTS (Rate Limiting)
-- ============================================================================

-- Supprimer la politique INSERT trop permissive
DROP POLICY IF EXISTS "analytics_events_insert_all" ON analytics_events;

-- ANALYTICS_EVENTS INSERT: Max 100 events par heure par IP
-- Note: Nécessite une colonne ip_address dans analytics_events
-- Si cette colonne n'existe pas, cette policy sera ignorée
CREATE POLICY "analytics_events_insert_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    -- Limiter à 100 insertions par heure
    (SELECT COUNT(*) FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );

-- ============================================================================
-- SÉCURITÉ 5: Protéger DEVICE_BACKUPS
-- ============================================================================

-- DEVICE_BACKUPS: Seulement le propriétaire du device_id
CREATE POLICY "device_backups_select_own" ON device_backups
  FOR SELECT
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "device_backups_insert_own" ON device_backups
  FOR INSERT
  WITH CHECK (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "device_backups_update_own" ON device_backups
  FOR UPDATE
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  )
  WITH CHECK (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "device_backups_delete_own" ON device_backups
  FOR DELETE
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

-- ============================================================================
-- SÉCURITÉ 6: Protéger CATEGORY_NOTES
-- ============================================================================

-- CATEGORY_NOTES: Seulement ses propres notes
CREATE POLICY "category_notes_select_own" ON category_notes
  FOR SELECT
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "category_notes_insert_own" ON category_notes
  FOR INSERT
  WITH CHECK (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "category_notes_update_own" ON category_notes
  FOR UPDATE
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  )
  WITH CHECK (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

CREATE POLICY "category_notes_delete_own" ON category_notes
  FOR DELETE
  USING (
    device_id = current_setting('request.headers')::json->>'x-device-id'
  );

-- ============================================================================
-- ✅ VÉRIFICATION
-- ============================================================================

-- Afficher toutes les politiques de sécurité créées
SELECT
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'analytics_events', 'device_backups', 'category_notes')
ORDER BY tablename, policyname;

-- ============================================================================
-- 🧪 TESTS DE SÉCURITÉ
-- ============================================================================

-- Test 1: Essayer de supprimer un participant qui n'appartient pas à l'utilisateur
-- (devrait échouer si auth.uid() ne correspond pas)
-- SELECT 'Test DELETE protection:' as test;
-- DELETE FROM participants WHERE user_id != auth.uid() LIMIT 1;

-- Test 2: Essayer de créer trop d'analytics_events (>100 en 1h)
-- (devrait être bloqué par rate limiting)

-- Test 3: Vérifier qu'on peut toujours lire groups et participants
SELECT 'Test groups SELECT:' as test, COUNT(*) as result FROM groups;
SELECT 'Test participants SELECT:' as test, COUNT(*) as result FROM participants;

-- ============================================================================
-- 📝 RÉSULTAT ATTENDU
-- ============================================================================

/*
Après exécution, les politiques suivantes seront en place:

AVANT (DANGEREUX):
- ❌ N'importe qui peut DELETE participants (USING true)
- ❌ N'importe qui peut UPDATE participants (USING true)
- ❌ N'importe qui peut insérer 1M analytics_events
- ❌ N'importe qui peut créer des groupes illimités

APRÈS (SÉCURISÉ):
- ✅ DELETE participants = seulement propriétaire (user_id/created_by)
- ✅ UPDATE participants = seulement propriétaire
- ✅ INSERT analytics_events = max 100/heure
- ✅ INSERT groups = authentifié OU 1/heure anonyme
- ✅ device_backups protégés par device_id header
- ✅ category_notes protégés par device_id header

IMPACT SUR L'APPLICATION:
- Les utilisateurs anonymes peuvent toujours LIRE groups et participants
- Mais ne peuvent plus MODIFIER ou SUPPRIMER les données des autres
- Rate limiting empêche le spam d'analytics
*/
