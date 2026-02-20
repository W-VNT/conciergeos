-- Fix role enum in notification functions
-- The valid roles are: 'ADMIN', 'OPERATEUR'
-- Not: 'GESTIONNAIRE'

-- 1. Fix notify_incident_opened
CREATE OR REPLACE FUNCTION notify_incident_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_user RECORD;
  should_notify boolean;
BEGIN
  -- Only notify on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Notify all ADMIN users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role = 'ADMIN'
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_incident_opened, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      -- Create in-app notification
      PERFORM create_notification(
        NEW.organisation_id,
        org_user.id,
        'INCIDENT_OPENED',
        'Nouveau ' || LOWER(NEW.severity) || ' incident',
        'Un incident de priorité ' || NEW.severity || ' a été ouvert',
        'INCIDENT',
        NEW.id,
        jsonb_build_object('severity', NEW.severity, 'status', NEW.status)
      );

      IF should_notify THEN
        RAISE LOG 'Incident % opened - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix notify_incident_assigned
CREATE OR REPLACE FUNCTION notify_incident_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prestataire_email text;
  prestataire_name text;
BEGIN
  -- Only notify if incident is assigned to someone and it changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    -- Get prestataire details
    SELECT email, name INTO prestataire_email, prestataire_name
    FROM prestataires
    WHERE id = NEW.assigned_to;

    -- Notify admins
    INSERT INTO notifications (
      organisation_id,
      user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      metadata
    )
    SELECT
      NEW.organisation_id,
      p.id,
      'INCIDENT_ASSIGNED',
      'Incident assigné',
      'L''incident a été assigné à ' || prestataire_name,
      'INCIDENT',
      NEW.id,
      jsonb_build_object('prestataire_id', NEW.assigned_to, 'prestataire_name', prestataire_name)
    FROM profiles p
    WHERE p.organisation_id = NEW.organisation_id
      AND p.role = 'ADMIN';

    RAISE LOG 'Incident % assigned to prestataire %', NEW.id, prestataire_name;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Fix notify_incident_resolved
CREATE OR REPLACE FUNCTION notify_incident_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_user RECORD;
  should_notify boolean;
BEGIN
  -- Only notify if status changed to RESOLU
  IF NEW.status = 'RESOLU' AND (OLD.status IS NULL OR OLD.status != 'RESOLU') THEN
    -- Notify all ADMIN users
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role = 'ADMIN'
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_incident_resolved, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      -- Create in-app notification
      PERFORM create_notification(
        NEW.organisation_id,
        org_user.id,
        'INCIDENT_RESOLVED',
        'Incident résolu',
        'Un incident a été marqué comme résolu',
        'INCIDENT',
        NEW.id,
        jsonb_build_object('severity', NEW.severity)
      );

      IF should_notify THEN
        RAISE LOG 'Incident % resolved - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Fix notify_reservation_confirmed
CREATE OR REPLACE FUNCTION notify_reservation_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_user RECORD;
  logement_name text;
  should_notify boolean;
BEGIN
  -- Only notify on INSERT when status is CONFIRMEE
  IF TG_OP = 'INSERT' AND NEW.status = 'CONFIRMEE' THEN
    -- Get logement name
    SELECT name INTO logement_name
    FROM logements
    WHERE id = NEW.logement_id;

    -- Notify all ADMIN users
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role = 'ADMIN'
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_reservation_confirmed, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      -- Create in-app notification
      PERFORM create_notification(
        NEW.organisation_id,
        org_user.id,
        'RESERVATION_CONFIRMED',
        'Nouvelle réservation confirmée',
        'Réservation confirmée pour ' || COALESCE(logement_name, 'un logement') || ' du ' || TO_CHAR(NEW.check_in_date, 'DD/MM/YYYY') || ' au ' || TO_CHAR(NEW.check_out_date, 'DD/MM/YYYY'),
        'RESERVATION',
        NEW.id,
        jsonb_build_object(
          'logement_name', logement_name,
          'check_in_date', NEW.check_in_date,
          'check_out_date', NEW.check_out_date,
          'guest_name', NEW.guest_name
        )
      );

      IF should_notify THEN
        RAISE LOG 'Reservation % confirmed - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Fix send_checkin_reminders
CREATE OR REPLACE FUNCTION send_checkin_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reservation RECORD;
  org_user RECORD;
  should_notify boolean;
BEGIN
  -- Find reservations with check-in tomorrow
  FOR reservation IN
    SELECT r.*, l.name as logement_name
    FROM reservations r
    JOIN logements l ON l.id = r.logement_id
    WHERE r.check_in_date = CURRENT_DATE + INTERVAL '1 day'
      AND r.status = 'CONFIRMEE'
  LOOP
    -- Notify all ADMIN users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = reservation.organisation_id
        AND role = 'ADMIN'
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_reservation_checkin_soon, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      IF should_notify THEN
        -- Create in-app notification
        PERFORM create_notification(
          reservation.organisation_id,
          org_user.id,
          'RESERVATION_CHECKIN_SOON',
          'Check-in demain',
          'Check-in prévu demain pour ' || reservation.logement_name || ' - ' || reservation.guest_name,
          'RESERVATION',
          reservation.id,
          jsonb_build_object(
            'logement_name', reservation.logement_name,
            'check_in_date', reservation.check_in_date,
            'guest_name', reservation.guest_name
          )
        );

        RAISE LOG 'Check-in reminder for reservation % - Would send to %', reservation.id, org_user.email;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 6. Fix send_checkout_today_notifications
CREATE OR REPLACE FUNCTION send_checkout_today_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reservation RECORD;
  org_user RECORD;
  should_notify boolean;
BEGIN
  -- Find reservations with check-out today
  FOR reservation IN
    SELECT r.*, l.name as logement_name
    FROM reservations r
    JOIN logements l ON l.id = r.logement_id
    WHERE r.check_out_date = CURRENT_DATE
      AND r.status = 'CONFIRMEE'
  LOOP
    -- Notify all ADMIN users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = reservation.organisation_id
        AND role = 'ADMIN'
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_reservation_checkout_today, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      IF should_notify IS NULL THEN
        should_notify := true;
      END IF;

      IF should_notify THEN
        -- Create in-app notification
        PERFORM create_notification(
          reservation.organisation_id,
          org_user.id,
          'RESERVATION_CHECKOUT_TODAY',
          'Check-out aujourd''hui',
          'Check-out prévu aujourd''hui pour ' || reservation.logement_name || ' - ' || reservation.guest_name,
          'RESERVATION',
          reservation.id,
          jsonb_build_object(
            'logement_name', reservation.logement_name,
            'check_out_date', reservation.check_out_date,
            'guest_name', reservation.guest_name
          )
        );

        RAISE LOG 'Check-out notification for reservation % - Would send to %', reservation.id, org_user.email;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 7. Fix check_urgent_missions
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

-- 8. Fix check_critical_incidents
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

    -- Notify all ADMIN users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = incident.organisation_id
        AND role = 'ADMIN'
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

          RAISE LOG 'Critical incident alert for incident % - Would send to %', incident.id, org_user.email;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION notify_incident_opened() IS
'Creates in-app notifications when a new incident is opened. Notifies all admins.';

COMMENT ON FUNCTION notify_incident_resolved() IS
'Creates notifications when an incident is marked as resolved.';

COMMENT ON FUNCTION notify_reservation_confirmed() IS
'Creates notifications when a new reservation is confirmed.';

COMMENT ON FUNCTION send_checkin_reminders() IS
'Sends reminders for check-ins happening tomorrow. Should be called daily by a cron job.';

COMMENT ON FUNCTION send_checkout_today_notifications() IS
'Sends notifications for check-outs happening today. Should be called daily by a cron job.';

COMMENT ON FUNCTION check_urgent_missions() IS
'Checks for urgent unassigned missions and sends alerts. Should be called hourly by a cron job.';

COMMENT ON FUNCTION check_critical_incidents() IS
'Checks for critical unresolved incidents and sends alerts. Should be called hourly by a cron job.';
