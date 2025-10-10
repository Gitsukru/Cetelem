-- 🔒 Row Level Security Policies pour Çetelem/Zikirmatik
--
-- Ce fichier contient toutes les politiques RLS pour sécuriser la base de données
-- À exécuter dans le SQL Editor de Supabase Dashboard
--
-- ⚠️  IMPORTANT: Exécuter ces commandes une par une dans l'ordre

-- ============================================================================
-- 1. TABLE: groups
-- ============================================================================

-- Activer RLS sur la table groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les groupes (pour jointure via code)
CREATE POLICY "groups_select_all" ON groups
  FOR SELECT
  USING (true);

-- Politique: Tout le monde peut créer un groupe (anonyme)
CREATE POLICY "groups_insert_all" ON groups
  FOR INSERT
  WITH CHECK (true);

-- Politique: Personne ne peut mettre à jour ou supprimer (groupes permanents)
-- Si besoin de modification/suppression, le faire manuellement via dashboard

-- ============================================================================
-- 2. TABLE: participants
-- ============================================================================

-- Activer RLS sur la table participants
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les participants (pour leaderboard)
CREATE POLICY "participants_select_all" ON participants
  FOR SELECT
  USING (true);

-- Politique: Tout le monde peut créer un participant (jointure anonyme)
CREATE POLICY "participants_insert_all" ON participants
  FOR INSERT
  WITH CHECK (true);

-- Politique: Tout le monde peut mettre à jour son score
-- (Dans une app anonyme, on fait confiance au client - peut être amélioré avec auth)
CREATE POLICY "participants_update_all" ON participants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique: Tout le monde peut supprimer son participant (quitter groupe)
CREATE POLICY "participants_delete_all" ON participants
  FOR DELETE
  USING (true);

-- ============================================================================
-- 3. TABLE: device_backups
-- ============================================================================

-- Activer RLS sur la table device_backups
ALTER TABLE device_backups ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire (via code unique)
CREATE POLICY "device_backups_select_all" ON device_backups
  FOR SELECT
  USING (
    -- Seulement les backups non expirés
    expires_at > NOW()
  );

-- Politique: Tout le monde peut créer un backup
CREATE POLICY "device_backups_insert_all" ON device_backups
  FOR INSERT
  WITH CHECK (true);

-- Politique: Personne ne peut modifier ou supprimer (backups read-only)
-- Les backups expirés seront nettoyés par une fonction serverless

-- ============================================================================
-- 4. TABLE: analytics_events
-- ============================================================================

-- Activer RLS sur la table analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut créer des événements (tracking anonyme)
CREATE POLICY "analytics_events_insert_all" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Politique: Personne ne peut lire (sauf admin via dashboard)
-- Les analytics sont agrégés dans analytics_summary

-- ============================================================================
-- 5. TABLE: analytics_summary
-- ============================================================================

-- Activer RLS sur la table analytics_summary
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les résumés publics
CREATE POLICY "analytics_summary_select_all" ON analytics_summary
  FOR SELECT
  USING (true);

-- Politique: Seulement les fonctions serverless peuvent écrire
-- (Sera géré par une fonction Edge ou cron job)

-- ============================================================================
-- 6. TABLE: category_notes
-- ============================================================================

-- Activer RLS sur la table category_notes
-- Structure attendue:
-- category_notes (
--   id UUID PRIMARY KEY,
--   group_id UUID REFERENCES groups(id),
--   participant_id UUID REFERENCES participants(id),
--   category VARCHAR(100),
--   note TEXT,
--   created_at TIMESTAMPTZ,
--   updated_at TIMESTAMPTZ
-- )

ALTER TABLE category_notes ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les notes du groupe
CREATE POLICY "category_notes_select_all" ON category_notes
  FOR SELECT
  USING (true);

-- Politique: Les utilisateurs peuvent créer leurs notes
CREATE POLICY "category_notes_insert_all" ON category_notes
  FOR INSERT
  WITH CHECK (true);

-- Politique: Les utilisateurs peuvent mettre à jour leurs notes
CREATE POLICY "category_notes_update_all" ON category_notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politique: Les utilisateurs peuvent supprimer leurs notes
CREATE POLICY "category_notes_delete_all" ON category_notes
  FOR DELETE
  USING (true);

-- ============================================================================
-- 🧹 NETTOYAGE AUTOMATIQUE (Optionnel)
-- ============================================================================

-- Fonction pour supprimer les backups expirés (à exécuter via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM device_backups
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un trigger pour appeler cette fonction tous les jours
-- (À configurer dans Supabase Dashboard > Database > Cron Jobs)

-- ============================================================================
-- 📊 INDEXES POUR PERFORMANCE
-- ============================================================================

-- Index sur groups.code pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);

-- Index sur participants.group_id pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON participants(group_id);

-- Index sur participants scores pour tri du leaderboard
CREATE INDEX IF NOT EXISTS idx_participants_scores ON participants(today_count DESC, week_count DESC);

-- Index sur device_backups.backup_code et expires_at
CREATE INDEX IF NOT EXISTS idx_device_backups_code ON device_backups(backup_code);
CREATE INDEX IF NOT EXISTS idx_device_backups_expires ON device_backups(expires_at);

-- Index sur analytics_events.created_at pour requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- Index sur category_notes pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_category_notes_group ON category_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_category_notes_participant ON category_notes(participant_id);
CREATE INDEX IF NOT EXISTS idx_category_notes_category ON category_notes(category);

-- ============================================================================
-- ✅ VÉRIFICATION
-- ============================================================================

-- Vérifier que RLS est activé sur toutes les tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
ORDER BY tablename;

-- Lister toutes les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 📝 NOTES DE SÉCURITÉ
-- ============================================================================

/*
⚠️  LIMITATIONS ACTUELLES (App anonyme):

1. **Pas d'authentification utilisateur**
   - L'app fonctionne en mode anonyme (pas de login)
   - Les politiques RLS permettent tout le monde (USING true)
   - Risque: N'importe qui peut modifier n'importe quel participant

2. **Améliorations futures avec Supabase Auth:**

   a) Utiliser anon key + Row Level Security basé sur session:
   ```sql
   -- Exemple avec auth
   CREATE POLICY "participants_update_own" ON participants
     FOR UPDATE
     USING (auth.uid()::text = user_id)
     WITH CHECK (auth.uid()::text = user_id);
   ```

   b) Utiliser JWT custom claims pour les groupes:
   ```sql
   CREATE POLICY "participants_update_group_member" ON participants
     FOR UPDATE
     USING (
       group_id IN (
         SELECT group_id FROM participants
         WHERE id = (auth.jwt() ->> 'participant_id')::uuid
       )
     );
   ```

3. **Protection contre les abus:**
   - Activer rate limiting sur Supabase (API settings)
   - Utiliser Supabase Edge Functions pour validation côté serveur
   - Logger les événements suspects via analytics_events

4. **Nettoyage automatique:**
   - Configurer un cron job pour cleanup_expired_backups()
   - Supprimer les groupes inactifs > 90 jours
   - Archiver les analytics_events > 30 jours

5. **Monitoring:**
   - Surveiller les métriques Supabase Dashboard
   - Alertes sur usage anormal (trop de writes)
   - Logs des erreurs RLS denied
*/

-- ============================================================================
-- 🚀 COMMANDES DE DÉPLOIEMENT
-- ============================================================================

/*
Pour déployer ces politiques RLS:

1. Se connecter à Supabase Dashboard: https://supabase.com/dashboard
2. Sélectionner le projet: sxtcyznkxtlcgkgrdrbi
3. Aller dans "SQL Editor"
4. Copier-coller les sections une par une
5. Exécuter chaque section
6. Vérifier avec les requêtes de vérification à la fin

Ordre recommandé:
1. Tables groups et participants (critiques)
2. Table device_backups
3. Tables analytics
4. Table category_notes
5. Indexes
6. Fonctions de nettoyage
7. Vérifications
*/
