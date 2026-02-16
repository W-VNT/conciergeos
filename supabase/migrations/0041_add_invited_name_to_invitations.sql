-- Add invited_name field to invitations table
-- This allows storing the invitee's name to personalize the invitation email

ALTER TABLE invitations
ADD COLUMN invited_name TEXT;

COMMENT ON COLUMN invitations.invited_name IS 'Optional name of the person being invited - used to personalize the email and pre-fill their profile';
