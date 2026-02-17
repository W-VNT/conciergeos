-- Add phone and avatar_url to profiles table
-- Part of Profile Management feature

-- Add columns only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Update RLS policy to allow users to update their own profile
CREATE POLICY "Users can update own profile fields"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add comment
COMMENT ON COLUMN profiles.phone IS 'User phone number (optional)';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image in storage';
