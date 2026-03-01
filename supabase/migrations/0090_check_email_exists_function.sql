-- Function to check if an email already exists in auth.users
-- Uses SECURITY DEFINER to access auth.users from client
CREATE OR REPLACE FUNCTION check_email_exists(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(email_input)
  );
END;
$$;
