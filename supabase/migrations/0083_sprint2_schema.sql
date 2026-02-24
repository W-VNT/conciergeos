-- Sprint 2: Revenue & Analytics schema changes
-- =============================================

-- R5: Tarification dynamique — pricing seasons per logement
CREATE TABLE IF NOT EXISTS pricing_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_month INT NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  end_month INT NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  price_per_night NUMERIC(10,2) NOT NULL CHECK (price_per_night >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_seasons_logement ON pricing_seasons(logement_id);
CREATE INDEX idx_pricing_seasons_org ON pricing_seasons(organisation_id);

ALTER TABLE pricing_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_seasons_org" ON pricing_seasons
  USING (organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pricing_seasons_insert" ON pricing_seasons
  FOR INSERT WITH CHECK (organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pricing_seasons_update" ON pricing_seasons
  FOR UPDATE USING (organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "pricing_seasons_delete" ON pricing_seasons
  FOR DELETE USING (organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

-- R6: Attribution source — source tracking on reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source TEXT;

-- Trigger for pricing_seasons updated_at
CREATE OR REPLACE FUNCTION update_pricing_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_seasons_updated_at
  BEFORE UPDATE ON pricing_seasons
  FOR EACH ROW EXECUTE FUNCTION update_pricing_seasons_updated_at();
