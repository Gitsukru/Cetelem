-- ============================================
-- HATIM SHARING SYSTEM - DATABASE SCHEMA
-- Version: 1.0
-- Date: 2026-01-04
-- ============================================

-- Table principale des Hatims
CREATE TABLE IF NOT EXISTS hatims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('kuran', 'cevsen')),
  creator_name VARCHAR(30) NOT NULL,
  description TEXT,
  deadline DATE,
  total_units INTEGER NOT NULL,  -- 30 pour kuran, 100 pour cevsen
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_by_device VARCHAR(64),

  CONSTRAINT description_length CHECK (char_length(description) <= 500),
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9]{8}$')
);

-- Participations (qui a pris quel cuz/bab)
CREATE TABLE IF NOT EXISTS hatim_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hatim_id UUID NOT NULL REFERENCES hatims(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  unit_number INTEGER NOT NULL,
  participant_name VARCHAR(30) NOT NULL,
  device_id VARCHAR(64),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  UNIQUE(hatim_id, round_number, unit_number)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_hatims_code ON hatims(code);
CREATE INDEX IF NOT EXISTS idx_hatims_active ON hatims(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_participations_hatim ON hatim_participations(hatim_id);
CREATE INDEX IF NOT EXISTS idx_participations_round ON hatim_participations(hatim_id, round_number);

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_hatim_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hatims_updated_at ON hatims;
CREATE TRIGGER update_hatims_updated_at
  BEFORE UPDATE ON hatims
  FOR EACH ROW EXECUTE FUNCTION update_hatim_timestamp();

-- Function: Verifier si round complet et creer nouveau round
CREATE OR REPLACE FUNCTION check_hatim_round_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_units INTEGER;
  v_claimed_count INTEGER;
BEGIN
  -- Obtenir total_units du hatim
  SELECT total_units INTO v_total_units
  FROM hatims WHERE id = NEW.hatim_id;

  -- Compter unites prises dans ce round
  SELECT COUNT(*) INTO v_claimed_count
  FROM hatim_participations
  WHERE hatim_id = NEW.hatim_id AND round_number = NEW.round_number;

  -- Si toutes les unites sont prises, incrementer current_round
  IF v_claimed_count >= v_total_units THEN
    UPDATE hatims
    SET current_round = NEW.round_number + 1
    WHERE id = NEW.hatim_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_participation_insert ON hatim_participations;
CREATE TRIGGER after_participation_insert
  AFTER INSERT ON hatim_participations
  FOR EACH ROW EXECUTE FUNCTION check_hatim_round_completion();

-- Row Level Security
ALTER TABLE hatims ENABLE ROW LEVEL SECURITY;
ALTER TABLE hatim_participations ENABLE ROW LEVEL SECURITY;

-- Policies: Acces ouvert (comme les groupes)
DROP POLICY IF EXISTS "hatims_select" ON hatims;
DROP POLICY IF EXISTS "hatims_insert" ON hatims;
DROP POLICY IF EXISTS "hatims_update" ON hatims;

CREATE POLICY "hatims_select" ON hatims FOR SELECT USING (true);
CREATE POLICY "hatims_insert" ON hatims FOR INSERT WITH CHECK (true);
CREATE POLICY "hatims_update" ON hatims FOR UPDATE USING (true);

DROP POLICY IF EXISTS "participations_select" ON hatim_participations;
DROP POLICY IF EXISTS "participations_insert" ON hatim_participations;
DROP POLICY IF EXISTS "participations_update" ON hatim_participations;
DROP POLICY IF EXISTS "participations_delete" ON hatim_participations;

CREATE POLICY "participations_select" ON hatim_participations FOR SELECT USING (true);
CREATE POLICY "participations_insert" ON hatim_participations FOR INSERT WITH CHECK (true);
CREATE POLICY "participations_update" ON hatim_participations FOR UPDATE USING (true);
CREATE POLICY "participations_delete" ON hatim_participations FOR DELETE USING (true);

-- Activer Realtime pour les participations
ALTER PUBLICATION supabase_realtime ADD TABLE hatim_participations;
