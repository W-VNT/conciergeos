-- ============================================================
-- Onboarding function: creates org + profile atomically
-- Uses SECURITY DEFINER to bypass RLS during onboarding
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_onboarding(
  p_user_id uuid,
  p_full_name text DEFAULT 'Admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- Check if profile already exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF FOUND THEN
    RETURN row_to_json(v_profile);
  END IF;

  -- Create organisation
  INSERT INTO public.organisations (name)
  VALUES ('Ma Conciergerie')
  RETURNING id INTO v_org_id;

  -- Create admin profile
  INSERT INTO public.profiles (id, organisation_id, full_name, role)
  VALUES (p_user_id, v_org_id, p_full_name, 'ADMIN')
  RETURNING * INTO v_profile;

  RETURN row_to_json(v_profile);
END;
$$;
