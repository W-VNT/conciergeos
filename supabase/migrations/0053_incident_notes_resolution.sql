-- Add notes (suivi) and expected_resolution_date to incidents
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS expected_resolution_date DATE;
