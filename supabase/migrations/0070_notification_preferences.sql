-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Mission notifications
  notify_mission_assigned BOOLEAN DEFAULT true,
  notify_mission_reminder BOOLEAN DEFAULT true,
  notify_mission_late BOOLEAN DEFAULT true,

  -- Incident notifications
  notify_incident_opened BOOLEAN DEFAULT true,
  notify_incident_assigned BOOLEAN DEFAULT true,
  notify_incident_resolved BOOLEAN DEFAULT true,

  -- Reservation notifications
  notify_reservation_confirmed BOOLEAN DEFAULT true,
  notify_reservation_checkin_soon BOOLEAN DEFAULT true,
  notify_reservation_checkout_today BOOLEAN DEFAULT true,

  -- Alert notifications
  notify_urgent_missions BOOLEAN DEFAULT true,
  notify_critical_incidents BOOLEAN DEFAULT true,

  -- Digest preferences
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for emails and alerts';
