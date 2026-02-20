-- Create a configuration table for storing app-level settings
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create policy: Only service role can read/write
CREATE POLICY "Service role full access on app_config"
  ON app_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert Supabase URL (public value, safe to commit)
INSERT INTO app_config (key, value) VALUES
  ('supabase_url', 'https://xhyoleegdoyxorgcjpiz.supabase.co')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Note: service_role_key must be added manually via SQL Editor
-- DO NOT commit the service_role_key to git
-- Run this in SQL Editor after migration:
-- INSERT INTO app_config (key, value) VALUES ('service_role_key', 'your-actual-service-role-key')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update notify_mission_assigned function to read from app_config table
CREATE OR REPLACE FUNCTION notify_mission_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  service_role_key text;
  request_body text;
BEGIN
  -- Only notify if mission is assigned to someone
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    -- Create in-app notification (existing functionality)
    PERFORM create_notification(
      NEW.organisation_id,
      NEW.assigned_to,
      'MISSION_ASSIGNED',
      'Nouvelle mission assignée',
      'Une mission de type ' || NEW.type || ' vous a été assignée',
      'MISSION',
      NEW.id,
      jsonb_build_object('mission_type', NEW.type)
    );

    -- Send email via Edge Function (NEW)
    BEGIN
      -- Get Supabase URL and service role key from app_config table
      SELECT value INTO function_url
      FROM app_config
      WHERE key = 'supabase_url';

      SELECT value INTO service_role_key
      FROM app_config
      WHERE key = 'service_role_key';

      -- Only attempt to call Edge Function if configuration is available
      IF function_url IS NOT NULL AND service_role_key IS NOT NULL THEN
        -- Build complete function URL
        function_url := function_url || '/functions/v1/send-mission-email';

        -- Build request body
        request_body := json_build_object('missionId', NEW.id)::text;

        -- Call Edge Function asynchronously
        PERFORM extensions.http((
          'POST',
          function_url,
          ARRAY[
            extensions.http_header('Authorization', 'Bearer ' || service_role_key),
            extensions.http_header('Content-Type', 'application/json')
          ],
          'application/json',
          request_body
        )::extensions.http_request);

        -- Log success (optional, comment out if not needed)
        RAISE LOG 'Email request sent for mission %', NEW.id;
      ELSE
        -- Log warning if configuration is missing
        RAISE WARNING 'Email not sent for mission % - Configuration not found in app_config', NEW.id;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to send email for mission %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Add comment explaining the configuration table
COMMENT ON TABLE app_config IS
'Application-level configuration settings. Used by triggers and functions to access sensitive values like API keys.';
