-- ============================================================
-- Remove duplicate RLS policy on profiles table
-- Keeps only the comprehensive policy that allows users to:
-- 1. View their own profile (id = auth.uid())
-- 2. View profiles in their organisation
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Keep only this one:
-- "Users can view their own profile or profiles in their org"
-- (created in migration 0038)
