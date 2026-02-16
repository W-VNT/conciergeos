-- ============================================================
-- Fix onboarding to handle invitations properly
-- If user has invitation_token, create profile in invited org
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
  v_invitation_token text;
  v_invitation record;
BEGIN
  -- Check if profile already exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF FOUND THEN
    RETURN row_to_json(v_profile);
  END IF;

  -- Get user metadata
  SELECT raw_user_meta_data INTO v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  v_is_invitation := COALESCE((v_user_metadata->>'is_invitation')::boolean, false);
  v_invitation_token := v_user_metadata->>'invitation_token';

  -- If invitation signup, find invitation and create profile in that org
  IF v_is_invitation AND v_invitation_token IS NOT NULL THEN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM invitations
    WHERE token = v_invitation_token
      AND status = 'PENDING'
    LIMIT 1;

    -- If invitation found and valid
    IF FOUND THEN
      -- Check if not expired
      IF v_invitation.expires_at > NOW() THEN
        -- Create profile in the invited organisation
        INSERT INTO public.profiles (id, organisation_id, full_name, role)
        VALUES (
          p_user_id,
          v_invitation.organisation_id,
          COALESCE(v_invitation.invited_name, p_full_name),
          v_invitation.role
        )
        RETURNING * INTO v_profile;

        -- Mark invitation as accepted
        UPDATE invitations
        SET status = 'ACCEPTED',
            accepted_at = NOW()
        WHERE id = v_invitation.id;

        RETURN row_to_json(v_profile);
      ELSE
        -- Mark invitation as expired
        UPDATE invitations
        SET status = 'EXPIRED'
        WHERE id = v_invitation.id;
      END IF;
    END IF;

    -- If we reach here, invitation was invalid/expired
    -- Don't create org, just return null
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

COMMENT ON FUNCTION public.handle_onboarding IS 'Creates profile for new users - either in invited org or creates new org for admins';
