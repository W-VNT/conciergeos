-- Fix column names in reservation notification functions
-- The actual column names are: check_in_date, check_out_date, guest_name
-- Not: date_debut, date_fin, nom_voyageur

-- 1. Fix notify_reservation_confirmed function
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

    -- Notify all ADMIN and MANAGER users
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
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

      -- TODO: Send email if should_notify is true
      IF should_notify THEN
        RAISE LOG 'Reservation % confirmed - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Fix send_checkin_reminders function
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
    -- Notify all ADMIN and MANAGER users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = reservation.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
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

        -- TODO: Send email
        RAISE LOG 'Check-in reminder for reservation % - Would send to %', reservation.id, org_user.email;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Fix send_checkout_today_notifications function
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
    -- Notify all ADMIN and MANAGER users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = reservation.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
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

        -- TODO: Send email
        RAISE LOG 'Check-out notification for reservation % - Would send to %', reservation.id, org_user.email;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION notify_reservation_confirmed() IS
'Creates notifications when a new reservation is confirmed. Fixed column names.';

COMMENT ON FUNCTION send_checkin_reminders() IS
'Sends reminders for check-ins happening tomorrow. Should be called daily by a cron job. Fixed column names.';

COMMENT ON FUNCTION send_checkout_today_notifications() IS
'Sends notifications for check-outs happening today. Should be called daily by a cron job. Fixed column names.';
