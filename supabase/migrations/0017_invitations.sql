-- Create invitations table for team member invitations
-- Migration: 0017_invitations.sql

-- Create invitation_status enum
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- Create invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'OPERATEUR',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_org_email_pending UNIQUE(organisation_id, email, status)
);

-- Index for fast token lookup
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org ON invitations(organisation_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- RLS policies

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invitations in their org
CREATE POLICY "Admins can manage org invitations"
ON invitations FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Anyone can view invitations by token (for acceptance page)
CREATE POLICY "Anyone can view invitation by token"
ON invitations FOR SELECT
TO authenticated
USING (true);

COMMENT ON TABLE invitations IS 'Team member invitations with email-based tokens';
COMMENT ON COLUMN invitations.token IS 'Unique token for invitation acceptance link';
COMMENT ON COLUMN invitations.expires_at IS 'Invitation expiration date (typically 7 days from creation)';
