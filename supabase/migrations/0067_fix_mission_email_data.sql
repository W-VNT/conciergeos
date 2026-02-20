-- Fix mission email trigger to pass data directly instead of just ID
CREATE OR REPLACE FUNCTION notify_mission_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  service_role_key text;
  request_body text;
  assignee_email text;
  assignee_name text;
  logement_name text;
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
      -- Get assignee email and name
      SELECT email, full_name INTO assignee_email, assignee_name
      FROM profiles
      WHERE id = NEW.assigned_to;

      -- Get logement name if available
      IF NEW.logement_id IS NOT NULL THEN
        SELECT name INTO logement_name
        FROM logements
        WHERE id = NEW.logement_id;
      END IF;

      -- Only send email if assignee has email
      IF assignee_email IS NOT NULL THEN
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

          -- Build request body with all data needed
          request_body := json_build_object(
            'missionId', NEW.id,
            'missionType', NEW.type,
            'assigneeEmail', assignee_email,
            'assigneeName', assignee_name,
            'logementName', COALESCE(logement_name, 'Non spécifié'),
            'scheduledAt', NEW.scheduled_at
          )::text;

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

          -- Log success
          RAISE LOG 'Email request sent for mission % to %', NEW.id, assignee_email;
        ELSE
          -- Log warning if configuration is missing
          RAISE WARNING 'Email not sent for mission % - Configuration not found in app_config', NEW.id;
        END IF;
      ELSE
        RAISE WARNING 'Email not sent for mission % - Assignee has no email', NEW.id;
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

-- Trigger already exists, just refresh the function
COMMENT ON FUNCTION notify_mission_assigned() IS
'Trigger function that creates an in-app notification and sends an email when a mission is assigned.
Fetches assignee and logement data directly in the trigger to avoid timing issues.';
