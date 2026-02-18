-- Add statut_juridique and address fields to prestataires
ALTER TABLE prestataires
  ADD COLUMN IF NOT EXISTS statut_juridique TEXT NOT NULL DEFAULT 'AUTRE',
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;
