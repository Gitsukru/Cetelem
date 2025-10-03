-- ============================================
-- MIGRATION : Ajouter les statistiques mensuelles
-- ============================================
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. AJOUTER LA COLONNE month_count
ALTER TABLE participants
ADD COLUMN month_count INTEGER DEFAULT 0 CHECK (month_count >= 0);

-- 2. METTRE À JOUR LA VUE leaderboard_view avec les stats mensuelles
DROP VIEW IF EXISTS leaderboard_view;

CREATE VIEW leaderboard_view AS
SELECT
  p.id,
  p.group_id,
  p.name,
  p.today_count,
  p.week_count,
  p.month_count,
  p.total_count,
  p.updated_at,
  g.code as group_code,
  g.name as group_name,
  (p.today_count * 10 + p.week_count * 2 + p.month_count * 1 + FLOOR(p.total_count / 10)) as points,
  ROW_NUMBER() OVER (PARTITION BY p.group_id ORDER BY p.today_count DESC) as rank_in_group
FROM participants p
JOIN groups g ON p.group_id = g.id
ORDER BY p.group_id, p.today_count DESC;

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
