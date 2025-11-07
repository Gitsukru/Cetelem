-- ====================================
-- FIX: Autoriser insertions anonymes dans analytics_events
-- ====================================
-- Permet aux utilisateurs anonymes d'insérer des événements analytics
-- L'admin peut toujours lire via sa policy authenticated
-- ====================================

-- Supprimer l'ancienne policy trop restrictive
DROP POLICY IF EXISTS "Admin insert analytics" ON analytics_events;

-- NOUVELLE POLICY: Tout le monde peut insérer (anonyme + authentifié)
CREATE POLICY "Public can insert analytics"
ON analytics_events
FOR INSERT
TO anon, authenticated  -- ✅ Autoriser TOUS (anonyme + authentifié)
WITH CHECK (true);  -- Pas de restriction sur l'insertion

-- L'admin peut toujours LIRE (policy existante)
-- Seul your-admin-email@example.com peut lire les données via "Admin read analytics"

-- ====================================
-- VÉRIFICATION DES POLICIES
-- ====================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'analytics_events'
ORDER BY cmd;

-- ====================================
-- TERMINÉ !
-- ====================================
-- Les utilisateurs peuvent maintenant insérer des événements
-- Seul l'admin peut les lire
-- ====================================
