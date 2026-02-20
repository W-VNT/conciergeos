-- Add UPDATE policy for profiles table
-- Allows admins to update profiles (including operator_capabilities) in their organization

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

-- Also allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

COMMENT ON POLICY "Admins can update profiles in own org" ON public.profiles IS
'Allows admins to update any profile in their organization, including operator capabilities';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
'Allows users to update their own profile information';
