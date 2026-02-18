-- Add siret column to prestataires
ALTER TABLE prestataires
  ADD COLUMN IF NOT EXISTS siret TEXT;
