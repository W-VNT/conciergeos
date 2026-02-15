-- Migration: Add CONTRAT to entity_type enum
-- Description: Allows attaching documents (PDFs) to contracts

-- Add CONTRAT to the entity_type enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'CONTRAT';

-- No need to modify the attachments table structure, just the enum
-- The existing RLS policies will work for CONTRAT as well since they filter by organisation_id
