-- ============================================================
-- Update handle_onboarding to use user metadata
-- Creates org with correct name from signup form
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
  v_org_name text;
  v_org_city text;
  v_user_metadata jsonb;
BEGIN
  -- Check if profile already exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF FOUND THEN
    RETURN row_to_json(v_profile);
  END IF;

  -- Get user metadata from auth.users
  SELECT raw_user_meta_data INTO v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  -- Extract org name and city from metadata (fallback to defaults)
  v_org_name := COALESCE(v_user_metadata->>'org_name', 'Ma Conciergerie');
  v_org_city := v_user_metadata->>'org_city';

  -- Create organisation with name from metadata
  INSERT INTO public.organisations (name, city, onboarding_completed)
  VALUES (v_org_name, v_org_city, true)
  RETURNING id INTO v_org_id;

  -- Use full_name from metadata if available
  IF v_user_metadata->>'full_name' IS NOT NULL THEN
    p_full_name := v_user_metadata->>'full_name';
  END IF;

  -- Create admin profile
  INSERT INTO public.profiles (id, organisation_id, full_name, role)
  VALUES (p_user_id, v_org_id, p_full_name, 'ADMIN')
  RETURNING * INTO v_profile;

  RETURN row_to_json(v_profile);
END;
$$;
