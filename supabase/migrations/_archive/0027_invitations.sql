-- Create invitations table for team member invitations
-- Part of Team Management feature

-- Create enum type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
  END IF;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'OPERATEUR',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Add constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_pending_invitation'
  ) THEN
    ALTER TABLE invitations
    ADD CONSTRAINT unique_pending_invitation UNIQUE(organisation_id, email, status);
  END IF;
END $$;

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organisation_id);

-- RLS: Admins can manage invitations in their org
CREATE POLICY "Admins can view org invitations"
ON invitations FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can create org invitations"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update org invitations"
ON invitations FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Comments
COMMENT ON TABLE invitations IS 'Invitations for new team members to join an organisation';
COMMENT ON COLUMN invitations.token IS 'Unique token for accepting the invitation';
COMMENT ON COLUMN invitations.expires_at IS 'Invitation expiration date (typically 7 days from creation)';
