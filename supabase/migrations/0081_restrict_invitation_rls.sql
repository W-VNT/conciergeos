-- Restrict invitation RLS: replace overly permissive USING(true) policy
-- The old policy exposed ALL invitations (including tokens) to anyone.
-- New policy: public can only SELECT pending, non-expired invitations.
-- This preserves the acceptance flow while preventing enumeration of
-- expired/accepted/cancelled invitations and their tokens.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view invitations by token" ON invitations;

-- Restrict public/anon SELECT to only pending, non-expired invitations
CREATE POLICY "Public can view pending invitations"
ON invitations FOR SELECT
USING (
  status = 'PENDING'
  AND expires_at > NOW()
);

COMMENT ON POLICY "Public can view pending invitations" ON invitations IS
'Allows unauthenticated users to view only pending non-expired invitations for the acceptance flow. Expired/accepted/cancelled invitations are hidden.';
