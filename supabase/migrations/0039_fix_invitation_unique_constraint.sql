-- Fix invitation unique constraint to only apply to PENDING invitations
-- This allows multiple CANCELLED/EXPIRED invitations for the same email
-- but prevents duplicate PENDING invitations

-- Drop the old constraint
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_org_email_pending;

-- Create a partial unique index that only applies to PENDING invitations
CREATE UNIQUE INDEX unique_org_email_pending
ON invitations(organisation_id, email)
WHERE status = 'PENDING';

COMMENT ON INDEX unique_org_email_pending IS 'Ensures only one pending invitation per email per organisation';
