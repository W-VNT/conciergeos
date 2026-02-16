-- ============================================================
-- Update onboarding function to handle invitation signups
-- If user has is_invitation metadata, don't create org
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
  v_user_metadata jsonb;
  v_is_invitation boolean;
BEGIN
  -- Check if profile already exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF FOUND THEN
    RETURN row_to_json(v_profile);
  END IF;

  -- Get user metadata to check if this is an invitation signup
  SELECT raw_user_meta_data INTO v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  v_is_invitation := COALESCE((v_user_metadata->>'is_invitation')::boolean, false);

  -- If invitation, profile will be created by acceptInvitation action
  -- So we just return null here and let the invitation flow handle it
  IF v_is_invitation THEN
    RETURN NULL;
  END IF;

  -- Normal signup: create organisation and admin profile
  INSERT INTO public.organisations (name, onboarding_completed)
  VALUES ('Ma Conciergerie', false)
  RETURNING id INTO v_org_id;

  INSERT INTO public.profiles (id, organisation_id, full_name, role)
  VALUES (p_user_id, v_org_id, p_full_name, 'ADMIN')
  RETURNING * INTO v_profile;

  RETURN row_to_json(v_profile);
END;
$$;

COMMENT ON FUNCTION public.handle_onboarding IS 'Creates organisation and admin profile for new users, unless they are joining via invitation';
