-- Migration: Create revenus table for detailed revenue tracking
-- Description: Track revenue per reservation with automatic commission calculation

CREATE TABLE revenus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  contrat_id UUID REFERENCES contrats(id) ON DELETE SET NULL,

  -- Montants
  montant_brut DECIMAL(10, 2) NOT NULL CHECK (montant_brut >= 0),
  taux_commission DECIMAL(5, 2) NOT NULL CHECK (taux_commission >= 0 AND taux_commission <= 100),
  montant_commission DECIMAL(10, 2) NOT NULL CHECK (montant_commission >= 0),
  montant_net DECIMAL(10, 2) NOT NULL CHECK (montant_net >= 0),

  -- Dates
  date_reservation DATE NOT NULL,
  date_checkin DATE NOT NULL,
  date_checkout DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one revenu per reservation
  UNIQUE(reservation_id)
);

-- Indexes for performance
CREATE INDEX idx_revenus_org ON revenus(organisation_id);
CREATE INDEX idx_revenus_logement ON revenus(logement_id);
CREATE INDEX idx_revenus_contrat ON revenus(contrat_id);
CREATE INDEX idx_revenus_date_checkin ON revenus(date_checkin);
CREATE INDEX idx_revenus_date_checkout ON revenus(date_checkout);

-- RLS policies
ALTER TABLE revenus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org revenus"
  ON revenus FOR SELECT
  TO authenticated
  USING (organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage revenus"
  ON revenus FOR ALL
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_revenus_updated_at
  BEFORE UPDATE ON revenus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE revenus IS 'Suivi détaillé des revenus par réservation avec commissions calculées automatiquement';
COMMENT ON COLUMN revenus.montant_brut IS 'Montant total de la réservation (copié depuis reservations.amount)';
COMMENT ON COLUMN revenus.taux_commission IS 'Taux de commission en % (copié depuis contrat actif)';
COMMENT ON COLUMN revenus.montant_commission IS 'Montant de la commission = montant_brut * taux / 100';
COMMENT ON COLUMN revenus.montant_net IS 'Montant net pour le propriétaire = montant_brut - commission';
