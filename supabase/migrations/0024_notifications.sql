-- Notifications system for ConciergeOS

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'MISSION_ASSIGNED',      -- Mission assignée à un opérateur
  'MISSION_URGENT',        -- Mission urgente créée
  'INCIDENT_CRITICAL',     -- Incident critique ouvert
  'INCIDENT_ASSIGNED',     -- Incident assigné à un prestataire
  'CONTRACT_EXPIRING',     -- Contrat expire bientôt
  'TEAM_INVITATION',       -- Invitation à rejoindre l'équipe
  'RESERVATION_CREATED',   -- Nouvelle réservation
  'SYSTEM'                 -- Notification système générale
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type entity_type,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organisation_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System/triggers can create notifications
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Helper function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_organisation_id UUID,
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_entity_type entity_type DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
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
    entity_id
  ) VALUES (
    p_organisation_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger: Notify when mission is assigned
CREATE OR REPLACE FUNCTION notify_mission_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if mission is assigned to someone
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    PERFORM create_notification(
      NEW.organisation_id,
      NEW.assigned_to,
      'MISSION_ASSIGNED',
      'Nouvelle mission assignée',
      'Une mission de type ' || NEW.type || ' vous a été assignée',
      'MISSION',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_mission_assigned
AFTER INSERT OR UPDATE ON missions
FOR EACH ROW
EXECUTE FUNCTION notify_mission_assigned();

-- Trigger: Notify admins when critical incident is created
CREATE OR REPLACE FUNCTION notify_critical_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Only for critical incidents
  IF NEW.severity = 'CRITIQUE' THEN
    -- Notify all admins in the organisation
    FOR admin_record IN
      SELECT id
      FROM profiles
      WHERE organisation_id = NEW.organisation_id
        AND role = 'ADMIN'
    LOOP
      PERFORM create_notification(
        NEW.organisation_id,
        admin_record.id,
        'INCIDENT_CRITICAL',
        '🚨 Incident critique',
        'Un incident critique a été signalé',
        'INCIDENT',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_critical_incident
AFTER INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION notify_critical_incident();

-- Trigger: Notify when urgent mission is created
CREATE OR REPLACE FUNCTION notify_urgent_mission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Only for urgent/emergency missions
  IF NEW.type = 'URGENCE' OR NEW.priority = 'CRITIQUE' THEN
    -- Notify all admins in the organisation
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
        '⚠️ Mission urgente',
        'Une mission urgente a été créée',
        'MISSION',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_urgent_mission
AFTER INSERT ON missions
FOR EACH ROW
EXECUTE FUNCTION notify_urgent_mission();

-- Trigger: Notify when contract is expiring soon (checked daily via cron or manual)
-- This would typically be run as a scheduled job, but here's the function
CREATE OR REPLACE FUNCTION notify_expiring_contracts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contract_record RECORD;
  admin_record RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- Find contracts expiring in 7 days or less
  FOR contract_record IN
    SELECT c.*, o.id as org_id
    FROM contrats c
    JOIN logements l ON c.logement_id = l.id
    JOIN organisations o ON l.organisation_id = o.id
    WHERE c.status = 'ACTIF'
      AND c.end_date >= CURRENT_DATE
      AND c.end_date <= CURRENT_DATE + INTERVAL '7 days'
  LOOP
    days_until_expiry := (contract_record.end_date - CURRENT_DATE);

    -- Notify all admins in the organisation
    FOR admin_record IN
      SELECT id
      FROM profiles
      WHERE organisation_id = contract_record.org_id
        AND role = 'ADMIN'
    LOOP
      PERFORM create_notification(
        contract_record.org_id,
        admin_record.id,
        'CONTRACT_EXPIRING',
        '📋 Contrat expire bientôt',
        'Un contrat expire dans ' || days_until_expiry || ' jour(s)',
        'CONTRAT',
        contract_record.id
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Trigger: Notify when team invitation is sent
CREATE OR REPLACE FUNCTION notify_team_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inviter_name TEXT;
  org_name TEXT;
BEGIN
  -- Get inviter name and org name
  SELECT p.full_name, o.name
  INTO inviter_name, org_name
  FROM profiles p
  JOIN organisations o ON p.organisation_id = o.id
  WHERE p.id = NEW.invited_by;

  -- Note: This creates a notification but the user doesn't exist yet
  -- In practice, this should send an email instead
  -- We'll handle this in the email notification system

  RETURN NEW;
END;
$$;

-- Note: Team invitations are better handled via email since the user doesn't have an account yet
