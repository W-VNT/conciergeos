-- Add access_instructions column to reservations
-- Used by the guest portal to display access info (lockbox code, parking, etc.)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS access_instructions TEXT;
