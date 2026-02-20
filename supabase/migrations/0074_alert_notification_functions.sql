-- Create notification functions for alerts
-- These should be called periodically by cron jobs

-- 1. Function to check for urgent unassigned missions
CREATE OR REPLACE FUNCTION check_urgent_missions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mission RECORD;
  org_user RECORD;
  should_notify boolean;
  notification_exists boolean;
BEGIN
  -- Find urgent missions that are not assigned and scheduled within next 24 hours
  FOR mission IN
    SELECT m.*, l.name as logement_name
    FROM missions m
    LEFT JOIN logements l ON l.id = m.logement_id
    WHERE m.assigned_to IS NULL
      AND m.status = 'NON_ASSIGNEE'
      AND m.scheduled_at <= NOW() + INTERVAL '24 hours'
      AND m.scheduled_at >= NOW()
  LOOP
    -- Notify all ADMIN and MANAGER users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = mission.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_urgent_missions, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      IF should_notify THEN
        -- Check if we already sent this notification today
        SELECT EXISTS(
          SELECT 1 FROM notifications
          WHERE user_id = org_user.id
            AND entity_type = 'MISSION'
            AND entity_id = mission.id
            AND type = 'URGENT_MISSION'
            AND created_at::date = CURRENT_DATE
        ) INTO notification_exists;

        -- Only create notification if we haven't sent one today
        IF NOT notification_exists THEN
          PERFORM create_notification(
            mission.organisation_id,
            org_user.id,
            'URGENT_MISSION',
            'Mission urgente non assignée',
            'Mission ' || mission.type || ' prévue le ' || TO_CHAR(mission.scheduled_at, 'DD/MM à HH24:MI') || ' non assignée' ||
              CASE WHEN mission.logement_name IS NOT NULL THEN ' - ' || mission.logement_name ELSE '' END,
            'MISSION',
            mission.id,
            jsonb_build_object(
              'mission_type', mission.type,
              'scheduled_at', mission.scheduled_at,
              'logement_name', mission.logement_name
            )
          );

          -- TODO: Send email
          RAISE LOG 'Urgent mission alert for mission % - Would send to %', mission.id, org_user.email;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION check_urgent_missions() IS
'Checks for urgent unassigned missions and sends alerts. Should be called hourly by a cron job.';


-- 2. Function to check for critical unresolved incidents
CREATE OR REPLACE FUNCTION check_critical_incidents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  incident RECORD;
  org_user RECORD;
  should_notify boolean;
  notification_exists boolean;
  hours_open integer;
BEGIN
  -- Find critical incidents that are still open after 2 hours
  FOR incident IN
    SELECT i.*, l.name as logement_name
    FROM incidents i
    LEFT JOIN logements l ON l.id = i.logement_id
    WHERE i.status IN ('OUVERT', 'EN_COURS')
      AND i.severity = 'CRITIQUE'
      AND i.created_at <= NOW() - INTERVAL '2 hours'
  LOOP
    -- Calculate hours since opening
    hours_open := EXTRACT(EPOCH FROM (NOW() - incident.created_at)) / 3600;

    -- Notify all ADMIN and MANAGER users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = incident.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_critical_incidents, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      IF should_notify THEN
        -- Check if we already sent this notification today
        SELECT EXISTS(
          SELECT 1 FROM notifications
          WHERE user_id = org_user.id
            AND entity_type = 'INCIDENT'
            AND entity_id = incident.id
            AND type = 'CRITICAL_INCIDENT'
            AND created_at::date = CURRENT_DATE
        ) INTO notification_exists;

        -- Only create notification if we haven't sent one today
        IF NOT notification_exists THEN
          PERFORM create_notification(
            incident.organisation_id,
            org_user.id,
            'CRITICAL_INCIDENT',
            'Incident critique non résolu',
            'Incident critique ouvert depuis ' || hours_open || 'h' ||
              CASE WHEN incident.logement_name IS NOT NULL THEN ' - ' || incident.logement_name ELSE '' END ||
              CASE WHEN incident.description IS NOT NULL THEN ' - ' || LEFT(incident.description, 50) ELSE '' END,
            'INCIDENT',
            incident.id,
            jsonb_build_object(
              'severity', incident.severity,
              'status', incident.status,
              'hours_open', hours_open,
              'logement_name', incident.logement_name
            )
          );

          -- TODO: Send email
          RAISE LOG 'Critical incident alert for incident % - Would send to %', incident.id, org_user.email;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION check_critical_incidents() IS
'Checks for critical unresolved incidents and sends alerts. Should be called hourly by a cron job.';
