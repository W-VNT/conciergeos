-- Fix mission status in check_urgent_missions function
-- The valid statuses are: 'A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE'
-- Not: 'NON_ASSIGNEE'

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
  -- Status 'A_FAIRE' means the mission is not yet started/assigned
  FOR mission IN
    SELECT m.*, l.name as logement_name
    FROM missions m
    LEFT JOIN logements l ON l.id = m.logement_id
    WHERE m.assigned_to IS NULL
      AND m.status = 'A_FAIRE'
      AND m.scheduled_at <= NOW() + INTERVAL '24 hours'
      AND m.scheduled_at >= NOW()
  LOOP
    -- Notify all ADMIN users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = mission.organisation_id
        AND role = 'ADMIN'
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

          RAISE LOG 'Urgent mission alert for mission % - Would send to %', mission.id, org_user.email;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION check_urgent_missions() IS
'Checks for urgent unassigned missions (status A_FAIRE, no assigned_to) and sends alerts. Should be called hourly by a cron job.';
