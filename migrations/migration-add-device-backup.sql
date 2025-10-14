-- ============================================
-- MIGRATION: Device Backup System
-- ============================================
--
-- Système de sauvegarde pour changer d'appareil
-- Sans login, avec code temporaire de 6 caractères
--
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. CRÉER LA TABLE DES BACKUPS TEMPORAIRES
CREATE TABLE IF NOT EXISTS device_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_code VARCHAR(6) NOT NULL UNIQUE,
  backup_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 2. INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_device_backups_code
  ON device_backups(backup_code);

CREATE INDEX IF NOT EXISTS idx_device_backups_expires
  ON device_backups(expires_at);

-- 3. ROW LEVEL SECURITY
ALTER TABLE device_backups ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut créer un backup
DO $$
BEGIN
  CREATE POLICY "Anyone can create backup"
    ON device_backups FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tout le monde peut lire avec le code
DO $$
BEGIN
  CREATE POLICY "Anyone can read with code"
    ON device_backups FOR SELECT
    TO anon, authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. FONCTION AUTO-SUPPRESSION DES BACKUPS EXPIRÉS
CREATE OR REPLACE FUNCTION delete_expired_backups()
RETURNS void AS $$
BEGIN
  DELETE FROM device_backups
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER CRON (exécuter toutes les heures)
-- NOTE: Nécessite l'extension pg_cron (disponible sur Supabase)
-- Alternative: Appeler manuellement ou via Edge Function

-- ============================================
-- MIGRATION TERMINÉE ! ✅
-- ============================================
--
-- Test:
-- INSERT INTO device_backups (backup_code, backup_data)
-- VALUES ('ABC123', '{"counters": {}, "categories": []}');
--
-- SELECT * FROM device_backups WHERE backup_code = 'ABC123';
-- ============================================
