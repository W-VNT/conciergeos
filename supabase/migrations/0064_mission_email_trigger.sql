-- Enable http extension for calling Edge Functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Modify notify_mission_assigned function to also send email via Edge Function
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
      NEW.id
    );

    -- Send email via Edge Function (NEW)
    BEGIN
      -- Get Supabase URL and service role key from app settings
      function_url := current_setting('app.supabase_url', true) || '/functions/v1/send-mission-email';
      service_role_key := current_setting('app.supabase_service_role_key', true);

      -- Only attempt to call Edge Function if configuration is available
      IF function_url IS NOT NULL AND service_role_key IS NOT NULL THEN
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
        RAISE WARNING 'Email not sent for mission % - Supabase URL or service role key not configured', NEW.id;
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

-- Drop and recreate trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS trigger_notify_mission_assigned ON missions;

CREATE TRIGGER trigger_notify_mission_assigned
AFTER INSERT OR UPDATE ON missions
FOR EACH ROW
EXECUTE FUNCTION notify_mission_assigned();

-- Add comment explaining the trigger behavior
COMMENT ON FUNCTION notify_mission_assigned() IS
'Trigger function that creates an in-app notification and sends an email when a mission is assigned to an operator.
Requires app.supabase_url and app.supabase_service_role_key to be configured in Supabase settings.';
