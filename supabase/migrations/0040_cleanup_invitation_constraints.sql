-- Clean up ALL invitation unique constraints and create only the one we need
-- This fixes the duplicate constraint error when cancelling invitations

-- Drop all possible unique constraints first (constraints depend on indexes)
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_org_email_pending;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_pending_invitation;

-- Then drop the indexes
DROP INDEX IF EXISTS unique_org_email_pending;
DROP INDEX IF EXISTS unique_pending_invitation;

-- Create ONE clean partial unique index that only applies to PENDING invitations
CREATE UNIQUE INDEX unique_pending_invitation_per_email
ON invitations(organisation_id, email)
WHERE status = 'PENDING';

COMMENT ON INDEX unique_pending_invitation_per_email IS 'Ensures only one pending invitation per email per organisation - allows multiple cancelled/expired invitations';
