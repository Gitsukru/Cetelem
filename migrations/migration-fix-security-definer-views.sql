-- ============================================
-- MIGRATION: Fix Security Definer Views
-- ============================================
--
-- This migration converts SECURITY DEFINER views
-- to SECURITY INVOKER views for proper RLS enforcement
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Fix analytics_daily view
ALTER VIEW IF EXISTS analytics_daily SET (security_invoker = true);

-- Fix analytics_top_categories view
ALTER VIEW IF EXISTS analytics_top_categories SET (security_invoker = true);

-- Fix analytics_groups_stats view
ALTER VIEW IF EXISTS analytics_groups_stats SET (security_invoker = true);

-- Fix leaderboard_view
ALTER VIEW IF EXISTS leaderboard_view SET (security_invoker = true);

-- Fix analytics_summary view (also created without security_invoker)
ALTER VIEW IF EXISTS analytics_summary SET (security_invoker = true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify the fix:
--
-- SELECT schemaname, viewname,
--        (pg_catalog.pg_get_viewdef(schemaname || '.' || viewname)::text ILIKE '%security_invoker%') as is_invoker
-- FROM pg_views
-- WHERE viewname IN ('analytics_daily', 'analytics_top_categories',
--                    'analytics_groups_stats', 'leaderboard_view', 'analytics_summary');
--
-- ============================================
-- MIGRATION COMPLETE
-- ============================================
