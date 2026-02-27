-- Create notification triggers for incidents

-- 1. Trigger for new incident opened
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
    -- Notify all ADMIN and MANAGER users in the organization
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
        AND email IS NOT NULL
    LOOP
      -- Check user notification preferences
      SELECT COALESCE(notify_incident_opened, true) INTO should_notify
      FROM notification_preferences
      WHERE user_id = org_user.id;

      -- Default to true if no preferences
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

      -- TODO: Send email if should_notify is true
      -- This would require an Edge Function similar to send-mission-email
      IF should_notify THEN
        RAISE LOG 'Incident % opened - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_incident_opened ON incidents;
CREATE TRIGGER trigger_notify_incident_opened
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_incident_opened();

COMMENT ON FUNCTION notify_incident_opened() IS
'Creates in-app notifications when a new incident is opened. Notifies all admins and managers.';


-- 2. Trigger for incident assigned to prestataire
CREATE OR REPLACE FUNCTION notify_incident_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prestataire_email text;
  prestataire_name text;
  should_notify boolean;
BEGIN
  -- Only notify if incident is assigned to someone and it changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    -- Get prestataire details
    SELECT email, name INTO prestataire_email, prestataire_name
    FROM prestataires
    WHERE id = NEW.assigned_to;

    -- Check notification preferences for the prestataire's contact
    -- For now, we'll create in-app notifications for organization users
    -- In a future version, prestataires could have their own user accounts

    -- Notify admins and managers
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
      AND p.role IN ('ADMIN', 'GESTIONNAIRE');

    RAISE LOG 'Incident % assigned to prestataire %', NEW.id, prestataire_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_incident_assigned ON incidents;
CREATE TRIGGER trigger_notify_incident_assigned
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_incident_assigned();

COMMENT ON FUNCTION notify_incident_assigned() IS
'Creates notifications when an incident is assigned to a prestataire.';


-- 3. Trigger for incident resolved
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
    -- Notify all ADMIN and MANAGER users
    FOR org_user IN
      SELECT id, email, full_name, role
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role IN ('ADMIN', 'GESTIONNAIRE')
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

      -- TODO: Send email if should_notify is true
      IF should_notify THEN
        RAISE LOG 'Incident % resolved - Email would be sent to %', NEW.id, org_user.email;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_incident_resolved ON incidents;
CREATE TRIGGER trigger_notify_incident_resolved
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_incident_resolved();

COMMENT ON FUNCTION notify_incident_resolved() IS
'Creates notifications when an incident is marked as resolved.';
