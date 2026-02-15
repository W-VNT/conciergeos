-- Create equipements table for logement inventory
-- Part of Logements improvements - Inventaire & Equipements

-- Create enum types
CREATE TYPE equipement_categorie AS ENUM ('ELECTROMENAGER', 'MOBILIER', 'LINGE', 'AUTRE');
CREATE TYPE equipement_etat AS ENUM ('BON', 'MOYEN', 'A_REMPLACER');

-- Create equipements table
CREATE TABLE equipements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  categorie equipement_categorie NOT NULL DEFAULT 'AUTRE',
  nom TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  etat equipement_etat NOT NULL DEFAULT 'BON',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_equipements_logement ON equipements(logement_id);
CREATE INDEX idx_equipements_categorie ON equipements(categorie);

-- RLS Policies
CREATE POLICY "Users can view org equipements"
ON equipements FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert org equipements"
ON equipements FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update org equipements"
ON equipements FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete org equipements"
ON equipements FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  )
);

-- Comments
COMMENT ON TABLE equipements IS 'Inventory of equipment and furniture per logement';
COMMENT ON COLUMN equipements.categorie IS 'Category: ELECTROMENAGER, MOBILIER, LINGE, AUTRE';
COMMENT ON COLUMN equipements.etat IS 'Condition: BON, MOYEN, A_REMPLACER';
