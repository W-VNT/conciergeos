-- Add UPDATE policy for profiles table
-- Allows admins to update profiles (including operator_capabilities) in their organization

-- Drop if exists to avoid conflict on re-run
DROP POLICY IF EXISTS "Admins can update profiles in own org" ON public.profiles;

CREATE POLICY "Admins can update profiles in own org"
  ON public.profiles FOR UPDATE
  USING (
    organisation_id = public.get_my_org_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

COMMENT ON POLICY "Admins can update profiles in own org" ON public.profiles IS
'Allows admins to update any profile in their organization, including operator capabilities';
