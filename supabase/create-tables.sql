-- 📦 Création des tables pour Çetelem/Zikirmatik
--
-- À exécuter AVANT rls-policies.sql
-- Dans Supabase Dashboard > SQL Editor

-- ============================================================================
-- 0. NETTOYAGE: Gérer les conflits potentiels
-- ============================================================================

-- Supprimer uniquement analytics_summary si c'est une vue
DO $$
BEGIN
  -- Vérifier si analytics_summary est une vue et la supprimer
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'analytics_summary') THEN
    DROP VIEW analytics_summary CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 1. TABLE: groups
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Zikir Grubu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur le code pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);

-- ============================================================================
-- 2. TABLE: participants
-- ============================================================================

CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  today_count INTEGER DEFAULT 0,
  week_count INTEGER DEFAULT 0,
  month_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte: nom unique par groupe
  UNIQUE(group_id, name)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON participants(group_id);
CREATE INDEX IF NOT EXISTS idx_participants_scores ON participants(today_count DESC, week_count DESC);
CREATE INDEX IF NOT EXISTS idx_participants_updated ON participants(updated_at DESC);

-- ============================================================================
-- 3. TABLE: device_backups
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_code TEXT UNIQUE NOT NULL,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Index pour recherche rapide
  CHECK (backup_code ~ '^[A-Z0-9]{6}$')
);

-- Index sur code et expiration
CREATE INDEX IF NOT EXISTS idx_device_backups_code ON device_backups(backup_code);
CREATE INDEX IF NOT EXISTS idx_device_backups_expires ON device_backups(expires_at);

-- ============================================================================
-- 4. TABLE: analytics_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);

-- ============================================================================
-- 5. TABLE: analytics_summary
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Une seule entrée par métrique par jour
  UNIQUE(metric_name, metric_date)
);

-- Index pour agrégations
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_name ON analytics_summary(metric_name);

-- ============================================================================
-- 6. TABLE: category_notes
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un seul note par participant par catégorie par groupe
  UNIQUE(group_id, participant_id, category)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_category_notes_group ON category_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_category_notes_participant ON category_notes(participant_id);
CREATE INDEX IF NOT EXISTS idx_category_notes_category ON category_notes(category);

-- ============================================================================
-- 🧹 FONCTION: Nettoyage automatique des backups expirés
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM device_backups
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🔔 TRIGGER: Mise à jour automatique updated_at
-- ============================================================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur participants
DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur category_notes
DROP TRIGGER IF EXISTS update_category_notes_updated_at ON category_notes;
CREATE TRIGGER update_category_notes_updated_at
  BEFORE UPDATE ON category_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ✅ VÉRIFICATION
-- ============================================================================

-- Lister toutes les tables créées
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
ORDER BY tablename;

-- Compter les colonnes par table
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('groups', 'participants', 'device_backups', 'analytics_events', 'analytics_summary', 'category_notes')
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- 📝 NOTES
-- ============================================================================

/*
✅ Tables créées:
1. groups - Groupes de zikir
2. participants - Participants aux groupes
3. device_backups - Codes de transfert d'appareil
4. analytics_events - Événements de tracking
5. analytics_summary - Résumés analytics
6. category_notes - Notes des catégories

✅ Index créés pour performance:
- idx_groups_code
- idx_participants_group_id
- idx_participants_scores
- idx_participants_updated
- idx_device_backups_code
- idx_device_backups_expires
- idx_analytics_events_created
- idx_analytics_events_name
- idx_analytics_summary_date
- idx_analytics_summary_name
- idx_category_notes_group
- idx_category_notes_participant
- idx_category_notes_category

✅ Fonctions:
- cleanup_expired_backups() - Nettoyage auto backups

✅ Triggers:
- update_participants_updated_at - Auto-update timestamp
- update_category_notes_updated_at - Auto-update timestamp

🔒 PROCHAINE ÉTAPE:
Exécuter rls-policies.sql pour activer Row Level Security
*/
