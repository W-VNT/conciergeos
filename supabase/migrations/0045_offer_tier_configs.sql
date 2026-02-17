-- ============================================================
-- 0045 — Offer tier configs + menage_price on logements
-- ============================================================

-- Table de configuration des offres par organisation
CREATE TABLE offer_tier_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('ESSENTIEL', 'SERENITE', 'SIGNATURE')),
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  services TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organisation_id, tier)
);

-- Index
CREATE INDEX idx_offer_tier_configs_org ON offer_tier_configs(organisation_id);

-- RLS
ALTER TABLE offer_tier_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org offer configs"
  ON offer_tier_configs FOR SELECT
  TO authenticated
  USING (organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage offer configs"
  ON offer_tier_configs FOR ALL
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_offer_tier_configs_updated_at
  BEFORE UPDATE ON offer_tier_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Prix ménage par logement
ALTER TABLE logements ADD COLUMN IF NOT EXISTS menage_price DECIMAL(10, 2) DEFAULT NULL;
