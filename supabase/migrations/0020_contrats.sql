-- Create contract types enum
CREATE TYPE contract_type AS ENUM ('EXCLUSIF', 'SIMPLE');

-- Create contract status enum
CREATE TYPE contract_status AS ENUM ('ACTIF', 'EXPIRE', 'RESILIE');

-- Create contrats table
CREATE TABLE contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  logement_id UUID REFERENCES logements(id) ON DELETE SET NULL,

  type contract_type NOT NULL DEFAULT 'SIMPLE',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status contract_status NOT NULL DEFAULT 'ACTIF',
  conditions TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure start_date < end_date
  CONSTRAINT valid_date_range CHECK (start_date < end_date)
);

-- Create index for common queries
CREATE INDEX idx_contrats_organisation ON contrats(organisation_id);
CREATE INDEX idx_contrats_proprietaire ON contrats(proprietaire_id);
CREATE INDEX idx_contrats_logement ON contrats(logement_id);
CREATE INDEX idx_contrats_status ON contrats(status);
CREATE INDEX idx_contrats_end_date ON contrats(end_date);

-- RLS policies
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org contrats"
  ON contrats FOR SELECT
  TO authenticated
  USING (organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can insert contrats"
  ON contrats FOR INSERT
  TO authenticated
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update contrats"
  ON contrats FOR UPDATE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete contrats"
  ON contrats FOR DELETE
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Function to automatically update status based on dates
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'RESILIE' THEN
    IF NEW.end_date < CURRENT_DATE THEN
      NEW.status := 'EXPIRE';
    ELSIF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
      NEW.status := 'ACTIF';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update status on insert/update
CREATE TRIGGER trigger_update_contract_status
  BEFORE INSERT OR UPDATE ON contrats
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_status();

-- Comments
COMMENT ON TABLE contrats IS 'Contrats de gestion entre proprietaires et conciergerie';
COMMENT ON COLUMN contrats.type IS 'EXCLUSIF: mandat exclusif, SIMPLE: mandat simple';
COMMENT ON COLUMN contrats.commission_rate IS 'Taux de commission en pourcentage (0-100)';
COMMENT ON COLUMN contrats.status IS 'ACTIF/EXPIRE/RESILIE - mis a jour automatiquement selon les dates';
