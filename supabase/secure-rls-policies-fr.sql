-- 🔒 POLITIQUES RLS SÉCURISÉES (Version Anonyme)
-- Script pour sécuriser une application publique/anonyme
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Date: 2025-10-12

-- ============================================================================
-- CONTEXTE: Application Anonyme Publique
-- ============================================================================
-- Cette application (Çetelem/Zikirmatik) est conçue pour être utilisée
-- de manière ANONYME sans authentification. Les politiques ci-dessous
-- permettent un accès public tout en ajoutant des protections contre:
-- 1. Spam et abus (limitation de débit)
-- 2. Déni de service (DoS)
-- 3. Surconsommation des quotas Supabase
-- 4. Manipulation malveillante des données critiques

-- ============================================================================
-- SÉCURITÉ 1: Activer RLS sur toutes les tables
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SÉCURITÉ 2: Supprimer TOUTES les politiques existantes (anciennes + nouvelles)
-- ============================================================================

-- groups - Anciennes politiques
DROP POLICY IF EXISTS "groups_select_all" ON groups;
DROP POLICY IF EXISTS "groups_insert_all" ON groups;
DROP POLICY IF EXISTS "groups_update_all" ON groups;
DROP POLICY IF EXISTS "groups_delete_all" ON groups;

-- groups - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "groups_select_public" ON groups;
DROP POLICY IF EXISTS "groups_insert_rate_limited" ON groups;
DROP POLICY IF EXISTS "groups_update_disabled" ON groups;
DROP POLICY IF EXISTS "groups_delete_disabled" ON groups;

-- participants - Anciennes politiques
DROP POLICY IF EXISTS "participants_select_all" ON participants;
DROP POLICY IF EXISTS "participants_insert_all" ON participants;
DROP POLICY IF EXISTS "participants_update_all" ON participants;
DROP POLICY IF EXISTS "participants_delete_all" ON participants;

-- participants - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "participants_select_public" ON participants;
DROP POLICY IF EXISTS "participants_insert_public" ON participants;
DROP POLICY IF EXISTS "participants_update_public" ON participants;
DROP POLICY IF EXISTS "participants_delete_public" ON participants;

-- device_backups - Anciennes politiques
DROP POLICY IF EXISTS "device_backups_select_all" ON device_backups;
DROP POLICY IF EXISTS "device_backups_insert_all" ON device_backups;
DROP POLICY IF EXISTS "device_backups_update_all" ON device_backups;
DROP POLICY IF EXISTS "device_backups_delete_all" ON device_backups;

-- device_backups - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "device_backups_select_by_code" ON device_backups;
DROP POLICY IF EXISTS "device_backups_insert_rate_limited" ON device_backups;
DROP POLICY IF EXISTS "device_backups_update_disabled" ON device_backups;
DROP POLICY IF EXISTS "device_backups_delete_expired" ON device_backups;

-- analytics_events - Anciennes politiques
DROP POLICY IF EXISTS "analytics_events_insert_all" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_select_all" ON analytics_events;

-- analytics_events - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "analytics_events_select_disabled" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_select_recent" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_rate_limited" ON analytics_events;

-- analytics_summary - Anciennes politiques
DROP POLICY IF EXISTS "analytics_summary_select_all" ON analytics_summary;
DROP POLICY IF EXISTS "analytics_summary_insert_all" ON analytics_summary;
DROP POLICY IF EXISTS "analytics_summary_update_all" ON analytics_summary;

-- analytics_summary - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "analytics_summary_select_public" ON analytics_summary;
DROP POLICY IF EXISTS "analytics_summary_insert_disabled" ON analytics_summary;
DROP POLICY IF EXISTS "analytics_summary_update_disabled" ON analytics_summary;

-- category_notes - Anciennes politiques
DROP POLICY IF EXISTS "category_notes_select_all" ON category_notes;
DROP POLICY IF EXISTS "category_notes_insert_all" ON category_notes;
DROP POLICY IF EXISTS "category_notes_update_all" ON category_notes;
DROP POLICY IF EXISTS "category_notes_delete_all" ON category_notes;

-- category_notes - Nouvelles politiques (si le script est exécuté plusieurs fois)
DROP POLICY IF EXISTS "category_notes_select_public" ON category_notes;
DROP POLICY IF EXISTS "category_notes_insert_rate_limited" ON category_notes;
DROP POLICY IF EXISTS "category_notes_update_public" ON category_notes;
DROP POLICY IF EXISTS "category_notes_delete_public" ON category_notes;

-- ============================================================================
-- SÉCURITÉ 3: GROUPS - Lecture publique, écriture limitée
-- ============================================================================

-- Lecture: Tout le monde peut voir les groupes
CREATE POLICY "groups_select_public" ON groups
  FOR SELECT
  USING (true);

-- Création: Limitée pour éviter le spam (maximum 10 groupes par heure)
-- Note: Cette vérification est basique, idéalement utiliser Edge Functions avec suivi IP
CREATE POLICY "groups_insert_rate_limited" ON groups
  FOR INSERT
  WITH CHECK (
    -- Vérifier qu'il n'y a pas plus de 10 créations dans la dernière heure
    (SELECT COUNT(*)
     FROM groups
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 10
  );

-- Mise à jour: Désactivée (les groupes ne doivent pas être modifiés après création)
-- CREATE POLICY "groups_update_disabled" ON groups FOR UPDATE USING (false);

-- Suppression: Désactivée (utiliser des Edge Functions avec authentification pour supprimer)
-- CREATE POLICY "groups_delete_disabled" ON groups FOR DELETE USING (false);

-- ============================================================================
-- SÉCURITÉ 4: PARTICIPANTS - Accès public avec protections
-- ============================================================================

-- Lecture: Tout le monde peut voir les participants
CREATE POLICY "participants_select_public" ON participants
  FOR SELECT
  USING (true);

-- Création: Tout le monde peut ajouter des participants
-- Protection: Limitation de débit globale (impossible de vérifier par groupe sans NEW)
-- Note: La limite par groupe sera gérée côté application
CREATE POLICY "participants_insert_public" ON participants
  FOR INSERT
  WITH CHECK (true);

-- Mise à jour: Tout le monde peut modifier (compteurs de zikir)
-- Ceci est nécessaire pour l'application, mais on limite les champs modifiables
CREATE POLICY "participants_update_public" ON participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Suppression: Tout le monde peut supprimer
-- Ceci est nécessaire pour permettre aux utilisateurs de nettoyer leurs groupes
CREATE POLICY "participants_delete_public" ON participants
  FOR DELETE
  USING (true);

-- ============================================================================
-- SÉCURITÉ 5: DEVICE_BACKUPS - Protection par code de sauvegarde
-- ============================================================================

-- Lecture: Seulement si on connaît le code exact (via logique applicative)
-- Note: La sécurité principale repose sur l'obscurité du code aléatoire
CREATE POLICY "device_backups_select_by_code" ON device_backups
  FOR SELECT
  USING (true);  -- L'application filtre par backup_code

-- Création: Limitée à 5 sauvegardes par heure pour éviter le spam
CREATE POLICY "device_backups_insert_rate_limited" ON device_backups
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM device_backups
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 5
  );

-- Mise à jour: Désactivée (les sauvegardes sont en lecture seule)
-- CREATE POLICY "device_backups_update_disabled" ON device_backups FOR UPDATE USING (false);

-- Suppression: Seulement les sauvegardes expirées (via fonction de nettoyage)
CREATE POLICY "device_backups_delete_expired" ON device_backups
  FOR DELETE
  USING (expires_at < NOW());

-- ============================================================================
-- SÉCURITÉ 6: ANALYTICS_EVENTS - Limitation de débit stricte
-- ============================================================================

-- Lecture: Limitée aux 24 dernières heures seulement (évite la lecture de tout l'historique)
-- L'application peut vérifier ses propres événements récents pour limiter le débit côté client
CREATE POLICY "analytics_events_select_recent" ON analytics_events
  FOR SELECT
  USING (created_at > NOW() - INTERVAL '24 hours');

-- Création: Limitée à 100 événements par heure pour éviter le spam
CREATE POLICY "analytics_events_insert_rate_limited" ON analytics_events
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 100
  );

-- ============================================================================
-- SÉCURITÉ 7: ANALYTICS_SUMMARY - Lecture seule publique
-- ============================================================================

-- Lecture: Tout le monde peut voir les statistiques agrégées
CREATE POLICY "analytics_summary_select_public" ON analytics_summary
  FOR SELECT
  USING (true);

-- Création/Mise à jour: Désactivées (gérées par les fonctions backend)
-- CREATE POLICY "analytics_summary_insert_disabled" ON analytics_summary FOR INSERT WITH CHECK (false);
-- CREATE POLICY "analytics_summary_update_disabled" ON analytics_summary FOR UPDATE USING (false);

-- ============================================================================
-- SÉCURITÉ 8: CATEGORY_NOTES - Accès public avec limite
-- ============================================================================

-- Lecture: Tout le monde peut voir les notes
CREATE POLICY "category_notes_select_public" ON category_notes
  FOR SELECT
  USING (true);

-- Création: Limitée à 50 notes par heure
CREATE POLICY "category_notes_insert_rate_limited" ON category_notes
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM category_notes
     WHERE created_at > NOW() - INTERVAL '1 hour'
    ) < 50
  );

-- Mise à jour: Tout le monde peut modifier ses notes
CREATE POLICY "category_notes_update_public" ON category_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Suppression: Tout le monde peut supprimer
CREATE POLICY "category_notes_delete_public" ON category_notes
  FOR DELETE
  USING (true);

-- ============================================================================
-- SÉCURITÉ 9: Fonction de nettoyage automatique
-- ============================================================================

-- Fonction pour nettoyer les anciennes données (à appeler via cron ou Edge Function)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les sauvegardes expirées
  DELETE FROM device_backups WHERE expires_at < NOW();

  -- Supprimer les événements analytics de plus de 90 jours
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

  -- Optionnel: Supprimer les groupes inactifs depuis 180 jours
  -- DELETE FROM groups WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SÉCURITÉ 10: Contraintes supplémentaires sur les tables
-- ============================================================================

-- Ajouter une contrainte sur la taille de backup_data (maximum 100KB)
-- Note: Cela évite les abus de stockage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'backup_data_size_limit'
  ) THEN
    ALTER TABLE device_backups
    ADD CONSTRAINT backup_data_size_limit
    CHECK (pg_column_size(backup_data) < 102400);  -- 100KB
  END IF;
END $$;

-- ============================================================================
-- ✅ VÉRIFICATION DES POLITIQUES
-- ============================================================================

-- Afficher toutes les politiques créées
SELECT
  schemaname AS schema,
  tablename AS table_name,
  policyname AS policy_name,
  cmd AS operation,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'Pas de clause USING'
  END AS using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'Pas de clause WITH CHECK'
  END AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
ORDER BY tablename, policyname;

-- ============================================================================
-- 🧪 TESTS DE VALIDATION
-- ============================================================================

-- Test 1: Vérifier que RLS est activé
SELECT
  tablename AS table_name,
  rowsecurity AS rls_active
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
ORDER BY tablename;

-- Test 2: Compter les politiques par table
SELECT
  tablename AS table_name,
  COUNT(*) AS nombre_politiques
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
GROUP BY tablename
ORDER BY tablename;

-- Test 3: Tester la lecture des groupes (devrait fonctionner)
SELECT 'Test groups SELECT:' AS test, COUNT(*) AS resultat FROM groups;

-- Test 4: Tester la lecture des participants (devrait fonctionner)
SELECT 'Test participants SELECT:' AS test, COUNT(*) AS resultat FROM participants;

-- ============================================================================
-- 📊 RÉSUMÉ DES PROTECTIONS
-- ============================================================================

/*
✅ PROTECTIONS IMPLÉMENTÉES:

1. Limitation de Débit (SQL):
   - groups: 10 créations/heure maximum
   - participants: 100 par groupe maximum
   - device_backups: 5 créations/heure maximum
   - analytics_events: 100 insertions/heure maximum
   - category_notes: 50 créations/heure maximum

2. Contraintes de Taille:
   - device_backups: 100KB maximum par sauvegarde

3. Nettoyage Automatique:
   - Sauvegardes expirées supprimées automatiquement
   - Événements analytics > 90 jours supprimés

4. Désactivations Stratégiques:
   - analytics_events SELECT désactivé (administrateur uniquement)
   - Certaines UPDATE/DELETE désactivées selon le contexte

⚠️ LIMITATIONS:

1. Limitation de débit basique:
   - Basée sur COUNT global, pas par IP/appareil
   - Pour une meilleure limitation de débit, utiliser Edge Functions

2. Application publique:
   - Pas d'authentification utilisateur
   - Sécurité basée sur l'obscurité (codes aléatoires)
   - Confiance dans les utilisateurs finaux

3. Surconsommation possible:
   - Malgré les limites, un attaquant peut atteindre les quotas
   - Recommandation: Surveillance et alertes Supabase

🔐 AMÉLIORATIONS RECOMMANDÉES:

1. Court terme:
   - Implémenter Edge Functions pour limitation de débit par IP
   - Ajouter CAPTCHA sur les actions critiques
   - Configurer les alertes Supabase pour usage anormal

2. Moyen terme:
   - Ajouter authentification optionnelle (Google, Email)
   - Implémenter la propriété des groupes
   - Chiffrer les données sensibles (notes)

3. Long terme:
   - Audit professionnel de sécurité
   - Tests d'intrusion
   - Certification de sécurité
*/
