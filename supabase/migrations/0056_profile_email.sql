-- Add email column to profiles and populate from auth.users
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate existing profiles with email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id;
