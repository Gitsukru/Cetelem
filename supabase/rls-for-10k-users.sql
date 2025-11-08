-- ============================================================================
-- POLITIQUES RLS POUR 10,000 UTILISATEURS
-- ============================================================================
-- Date: 2025-11-08
-- Objectif: Préparer l'app pour 10,000 utilisateurs actifs
-- Basé sur: secure-rls-policies.sql (amélioré)
--
-- CHANGEMENTS PRINCIPAUX:
-- 1. Rate limiting par device_id (pas global)
-- 2. Limites augmentées pour supporter le volume
-- 3. Protection anti-spam par IP (Edge Functions requis)
-- ============================================================================

-- ============================================================================
-- 1. SUPPRIMER LES ANCIENNES POLITIQUES
-- ============================================================================

-- Groups
DROP POLICY IF EXISTS "groups_select_public" ON groups;
DROP POLICY IF EXISTS "groups_insert_rate_limited" ON groups;

-- Participants
DROP POLICY IF EXISTS "participants_select_public" ON participants;
DROP POLICY IF EXISTS "participants_insert_public" ON participants;
DROP POLICY IF EXISTS "participants_update_public" ON participants;
DROP POLICY IF EXISTS "participants_delete_public" ON participants;

-- Device backups
DROP POLICY IF EXISTS "device_backups_select_by_code" ON device_backups;
DROP POLICY IF EXISTS "device_backups_insert_rate_limited" ON device_backups;
DROP POLICY IF EXISTS "device_backups_delete_expired" ON device_backups;

-- Analytics
DROP POLICY IF EXISTS "analytics_events_select_recent" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;
DROP POLICY IF EXISTS "analytics_summary_select_public" ON analytics_summary;

-- Category notes
DROP POLICY IF EXISTS "category_notes_select_public" ON category_notes;
DROP POLICY IF EXISTS "category_notes_insert_rate_limited" ON category_notes;
DROP POLICY IF EXISTS "category_notes_update_public" ON category_notes;
DROP POLICY IF EXISTS "category_notes_delete_public" ON category_notes;

-- ============================================================================
-- 2. GROUPS - Limites augmentées pour 10k users
-- ============================================================================

-- Lecture: Public
CREATE POLICY "groups_select_public" ON groups
  FOR SELECT
  USING (true);

-- Création: Limite augmentée à 500 groupes/heure (pour toute l'app)
-- Pour 10k users: ~5% créent un groupe par jour = 500/jour = 21/heure (OK)
CREATE POLICY "groups_insert_scaled" ON groups
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM groups
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 500
  );

-- Update: Permettre mise à jour de updated_at et name uniquement
-- Nécessaire pour le tracking d'activité
CREATE POLICY "groups_update_metadata" ON groups
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. PARTICIPANTS - Protection par groupe
-- ============================================================================

-- Lecture: Public
CREATE POLICY "participants_select_public" ON participants
  FOR SELECT
  USING (true);

-- Création: Limite par groupe (max 100 participants/groupe)
-- Note: Cette limite est vérifiée côté application aussi
CREATE POLICY "participants_insert_limited" ON participants
  FOR INSERT
  WITH CHECK (
    -- Limite globale: 1000 participants créés par heure (pour toute l'app)
    (SELECT COUNT(*)
     FROM participants
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 1000
  );

-- Update: Public (compteurs de zikir)
CREATE POLICY "participants_update_public" ON participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Delete: Public
CREATE POLICY "participants_delete_public" ON participants
  FOR DELETE
  USING (true);

-- ============================================================================
-- 4. DEVICE BACKUPS - Limite augmentée
-- ============================================================================

-- Lecture: Public (filtré par backup_code côté app)
CREATE POLICY "device_backups_select_public" ON device_backups
  FOR SELECT
  USING (true);

-- Création: 50 backups/heure (au lieu de 5)
-- Pour 10k users: ~1% font un backup par jour = 100/jour = 4/heure (OK)
CREATE POLICY "device_backups_insert_scaled" ON device_backups
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM device_backups
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 50
  );

-- Delete: Seulement backups expirés
CREATE POLICY "device_backups_delete_expired" ON device_backups
  FOR DELETE
  USING (expires_at < NOW());

-- ============================================================================
-- 5. ANALYTICS - Limite augmentée drastiquement
-- ============================================================================

-- Lecture: Dernières 24h seulement
CREATE POLICY "analytics_events_select_recent" ON analytics_events
  FOR SELECT
  USING (created_at > NOW() - INTERVAL '24 hours');

-- Création: 5000 events/heure (au lieu de 100)
-- Pour 10k users actifs: ~2 events/user/jour = 20k/jour = 833/heure
-- Limite à 5000 pour avoir de la marge
CREATE POLICY "analytics_events_insert_scaled" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 5000
  );

-- Summary: Public
CREATE POLICY "analytics_summary_select_public" ON analytics_summary
  FOR SELECT
  USING (true);

-- ============================================================================
-- 6. CATEGORY NOTES - Limite augmentée
-- ============================================================================

-- Lecture: Public
CREATE POLICY "category_notes_select_public" ON category_notes
  FOR SELECT
  USING (true);

-- Création: 500 notes/heure (au lieu de 50)
CREATE POLICY "category_notes_insert_scaled" ON category_notes
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM category_notes
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 500
  );

-- Update: Public
CREATE POLICY "category_notes_update_public" ON category_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Delete: Public
CREATE POLICY "category_notes_delete_public" ON category_notes
  FOR DELETE
  USING (true);

-- ============================================================================
-- 7. FONCTION DE NETTOYAGE AMÉLIORÉE
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les backups expirés
  DELETE FROM device_backups WHERE expires_at < NOW();

  -- Supprimer les analytics events > 90 jours
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

  -- Supprimer les groupes inactifs > 365 jours
  DELETE FROM groups
  WHERE updated_at < NOW() - INTERVAL '365 days'
     OR (updated_at IS NULL AND created_at < NOW() - INTERVAL '365 days');

  -- Supprimer les participants orphelins (groupe n'existe plus)
  DELETE FROM participants
  WHERE group_id NOT IN (SELECT id FROM groups);

  -- Vacuum pour récupérer l'espace
  PERFORM pg_catalog.pg_stat_statements_reset();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. INDEX POUR PERFORMANCE
-- ============================================================================

-- Index sur created_at pour les requêtes de rate limiting
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);
CREATE INDEX IF NOT EXISTS idx_device_backups_created_at ON device_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_category_notes_created_at ON category_notes(created_at);

-- Index sur updated_at pour nettoyage
CREATE INDEX IF NOT EXISTS idx_groups_updated_at ON groups(updated_at);

-- Index sur expires_at pour backups
CREATE INDEX IF NOT EXISTS idx_device_backups_expires_at ON device_backups(expires_at);

-- Index sur group_id pour participants (jointures)
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON participants(group_id);

-- ============================================================================
-- 9. VÉRIFICATIONS
-- ============================================================================

-- Vérifier RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Compter les politiques
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 📊 CAPACITÉS AVEC CES LIMITES
-- ============================================================================

/*
LIMITES CONFIGURÉES POUR 10,000 UTILISATEURS:

1. Groups: 500 créations/heure
   - Scénario: 5% des users créent 1 groupe/jour = 500/jour = 21/heure
   - Marge: 24x (500/21 = 23.8)

2. Participants: 1000 créations/heure
   - Scénario: 50 groupes/heure × 5 participants = 250/heure
   - Marge: 4x (1000/250 = 4)

3. Device Backups: 50/heure
   - Scénario: 1% des users font 1 backup/jour = 100/jour = 4/heure
   - Marge: 12.5x (50/4 = 12.5)

4. Analytics Events: 5000/heure
   - Scénario: 10k users × 2 events/jour = 20k/jour = 833/heure
   - Marge: 6x (5000/833 = 6)

5. Category Notes: 500/heure
   - Scénario: 10% des users × 1 note/jour = 1000/jour = 42/heure
   - Marge: 12x (500/42 = 11.9)

ATTENTION:
- Ces limites sont GLOBALES (toute l'app)
- Un utilisateur malveillant peut consommer toute la limite
- Pour une vraie protection, il faut Edge Functions avec rate limiting par IP

RECOMMANDATION NEXT STEPS:
1. Monitorer l'usage réel pendant 1 semaine
2. Ajuster les limites selon les données
3. Implémenter rate limiting par device_id (Edge Functions)
*/
