-- ============================================================
-- Fix: Profiles RLS recursion
-- The original policy "Users can view profiles in own org" does:
--   organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
-- This causes infinite recursion when profiles is joined from other tables.
-- Replace with get_my_org_id() which is SECURITY DEFINER and bypasses RLS.
-- ============================================================

DROP POLICY IF EXISTS "Users can view profiles in own org" ON public.profiles;

CREATE POLICY "Users can view profiles in own org"
  ON public.profiles FOR SELECT
  USING (organisation_id = public.get_my_org_id());
