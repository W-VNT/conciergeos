-- Add phone and avatar_url fields to profiles table
-- Migration: 0015_profile_fields.sql

ALTER TABLE profiles
  ADD COLUMN phone TEXT,
  ADD COLUMN avatar_url TEXT;

COMMENT ON COLUMN profiles.phone IS 'User phone number (optional)';
COMMENT ON COLUMN profiles.avatar_url IS 'Public URL to user avatar in Supabase Storage';
