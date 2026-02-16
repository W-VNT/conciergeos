-- Fix invitation RLS policy to allow unauthenticated users to view invitations
-- This is necessary for the invitation acceptance flow where users click
-- the invitation link before being logged in

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- Create new policy that allows both authenticated AND anonymous users
-- to view invitations (needed for accepting invitations before signup)
CREATE POLICY "Public can view invitations by token"
ON invitations FOR SELECT
USING (true);

COMMENT ON POLICY "Public can view invitations by token" ON invitations IS
'Allows unauthenticated users to view invitations for the acceptance flow';
