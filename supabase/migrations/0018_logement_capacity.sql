-- Add capacity fields to logements table
ALTER TABLE logements
  ADD COLUMN bedrooms INTEGER,
  ADD COLUMN beds INTEGER,
  ADD COLUMN max_guests INTEGER;

-- Add check constraints to ensure positive values
ALTER TABLE logements
  ADD CONSTRAINT bedrooms_positive CHECK (bedrooms IS NULL OR bedrooms > 0),
  ADD CONSTRAINT beds_positive CHECK (beds IS NULL OR beds > 0),
  ADD CONSTRAINT max_guests_positive CHECK (max_guests IS NULL OR max_guests > 0);

-- Add comment
COMMENT ON COLUMN logements.bedrooms IS 'Nombre de chambres';
COMMENT ON COLUMN logements.beds IS 'Nombre de lits';
COMMENT ON COLUMN logements.max_guests IS 'Capacité maximum de voyageurs';
