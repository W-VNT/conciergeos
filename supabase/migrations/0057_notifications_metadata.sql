-- Add metadata column to notifications for storing entity-specific info
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update create_notification function to accept optional metadata
CREATE OR REPLACE FUNCTION create_notification(
  p_organisation_id UUID,
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_entity_type entity_type DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    organisation_id,
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_organisation_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Update notify_mission_assigned to include mission type in metadata
CREATE OR REPLACE FUNCTION notify_mission_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
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
  END IF;

  RETURN NEW;
END;
$$;

-- Update notify_urgent_mission to include mission type in metadata
CREATE OR REPLACE FUNCTION notify_urgent_mission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  IF NEW.type = 'URGENCE' OR NEW.priority = 'CRITIQUE' THEN
    FOR admin_record IN
      SELECT id
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role = 'ADMIN'
    LOOP
      PERFORM create_notification(
        NEW.organisation_id,
        admin_record.id,
        'MISSION_URGENT',
        'Mission urgente',
        'Une mission urgente a été créée',
        'MISSION',
        NEW.id,
        jsonb_build_object('mission_type', NEW.type)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
