-- ============================================================
-- Fix: Profiles RLS for new users
-- Allow users to read their own profile even before onboarding
-- This fixes 406 errors during signup/onboarding flow
-- ============================================================

DROP POLICY IF EXISTS "Users can view profiles in own org" ON public.profiles;

CREATE POLICY "Users can view their own profile or profiles in their org"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR
    (organisation_id IS NOT NULL AND organisation_id = public.get_my_org_id())
  );
