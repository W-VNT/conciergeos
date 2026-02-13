-- ============================================================
-- Fix: Allow authenticated users to create their first organisation
-- and read their own profile immediately after creation.
-- This enables the auto-onboarding flow in requireProfile().
-- ============================================================

-- Allow any authenticated user to insert an organisation (needed for onboarding)
CREATE POLICY "Authenticated users can create an organisation"
  ON public.organisations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read their own profile directly (not just via org membership)
-- This ensures a freshly inserted profile is immediately visible
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());
