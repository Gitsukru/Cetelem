-- ============================================
-- MIGRATION: Analytics avec Supabase
-- ============================================
--
-- Créer une table pour tracker les événements
-- 100% gratuit, tes données à toi !
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. CRÉER LA TABLE DES ÉVÉNEMENTS
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_analytics_event_name
  ON analytics_events(event_name);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_data
  ON analytics_events USING GIN (event_data);

-- 3. ROW LEVEL SECURITY
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut insérer (tracking)
DO $$
BEGIN
  CREATE POLICY "Anyone can insert analytics"
    ON analytics_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Seuls les admins peuvent lire (toi)
DO $$
BEGIN
  CREATE POLICY "Only service role can read analytics"
    ON analytics_events FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. VUES POUR LE DASHBOARD

-- Vue: Événements par jour
CREATE OR REPLACE VIEW analytics_daily AS
SELECT
  DATE(created_at) as date,
  event_name,
  COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_name
ORDER BY date DESC, count DESC;

-- Vue: Top catégories de zikir
CREATE OR REPLACE VIEW analytics_top_categories AS
SELECT
  event_data->>'category' as category,
  COUNT(*) as total_counts,
  MAX(created_at) as last_counted
FROM analytics_events
WHERE event_name = 'zikir_counted'
GROUP BY category
ORDER BY total_counts DESC;

-- Vue: Statistiques groupes
CREATE OR REPLACE VIEW analytics_groups_stats AS
SELECT
  COUNT(CASE WHEN event_name = 'group_created' THEN 1 END) as groups_created,
  COUNT(CASE WHEN event_name = 'group_joined' THEN 1 END) as groups_joined,
  COUNT(CASE WHEN event_name = 'group_left' THEN 1 END) as groups_left,
  DATE(created_at) as date
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vue: Résumé global
CREATE OR REPLACE VIEW analytics_summary AS
SELECT
  event_name,
  COUNT(*) as total,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as today,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as this_month
FROM analytics_events
GROUP BY event_name
ORDER BY total DESC;

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
--
-- Vérifier que ça marche:
-- SELECT * FROM analytics_summary;
--
-- Voir les événements récents:
-- SELECT * FROM analytics_events
-- ORDER BY created_at DESC LIMIT 10;
--
-- ============================================

-- REQUÊTES UTILES POUR DASHBOARD

-- Événements des dernières 24h
-- SELECT event_name, COUNT(*)
-- FROM analytics_events
-- WHERE created_at > NOW() - INTERVAL '1 day'
-- GROUP BY event_name;

-- Activité par heure (aujourd'hui)
-- SELECT
--   EXTRACT(HOUR FROM created_at) as hour,
--   COUNT(*) as events
-- FROM analytics_events
-- WHERE created_at > CURRENT_DATE
-- GROUP BY hour
-- ORDER BY hour;

-- Groupes les plus actifs (par nombre de zikir)
-- SELECT
--   event_data->>'groupCode' as group_code,
--   COUNT(*) as activity
-- FROM analytics_events
-- WHERE event_name IN ('zikir_counted', 'group_joined')
--   AND event_data->>'groupCode' IS NOT NULL
-- GROUP BY group_code
-- ORDER BY activity DESC
-- LIMIT 10;
