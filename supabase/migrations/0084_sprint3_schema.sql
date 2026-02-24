-- ============================================================
-- Sprint 3: Communication & Automatisation
-- ============================================================

-- ── Photos (L1 galerie logement, MI2 photos missions) ──────
-- Using existing `attachments` table for photos.
-- Add position + caption + is_main columns for gallery support.
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT '';
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT FALSE;

-- ── Mission Comments (MI1) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_comments_mission ON mission_comments(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_comments_org ON mission_comments(organisation_id);

ALTER TABLE mission_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_comments_org_access" ON mission_comments
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

-- ── Mission Recurrences (MI4) ──────────────────────────────
CREATE TABLE IF NOT EXISTS mission_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE')),
  frequency TEXT NOT NULL CHECK (frequency IN ('HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 6=Sat
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28),
  scheduled_time TEXT NOT NULL DEFAULT '09:00',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'NORMALE' CHECK (priority IN ('NORMALE', 'HAUTE', 'CRITIQUE')),
  notes TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_recurrences_org ON mission_recurrences(organisation_id);
CREATE INDEX IF NOT EXISTS idx_mission_recurrences_logement ON mission_recurrences(logement_id);

ALTER TABLE mission_recurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_recurrences_org_access" ON mission_recurrences
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

CREATE TRIGGER set_mission_recurrences_updated_at
  BEFORE UPDATE ON mission_recurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SLA Configs (MI9 + IN6) ────────────────────────────────
CREATE TABLE IF NOT EXISTS sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('MISSION', 'INCIDENT')),
  subtype TEXT NOT NULL, -- mission type (CHECKIN, MENAGE...) or incident severity (MINEUR, MOYEN, CRITIQUE)
  max_hours INTEGER NOT NULL CHECK (max_hours > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, entity_type, subtype)
);

ALTER TABLE sla_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sla_configs_org_access" ON sla_configs
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

CREATE TRIGGER set_sla_configs_updated_at
  BEFORE UPDATE ON sla_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Activity Logs (IN2 timeline) ───────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('INCIDENT', 'MISSION', 'CONTRAT', 'RESERVATION', 'LOGEMENT')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- e.g. 'STATUS_CHANGED', 'COMMENT_ADDED', 'ASSIGNED', 'CREATED'
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_org_access" ON activity_logs
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

-- ── Guest Message Templates (R3) ──────────────────────────
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  subject TEXT NOT NULL DEFAULT '' CHECK (char_length(subject) <= 500),
  body TEXT NOT NULL CHECK (char_length(body) <= 10000),
  type TEXT NOT NULL CHECK (type IN ('CONFIRMATION', 'RAPPEL', 'REMERCIEMENT', 'ACCES', 'CUSTOM')),
  channel TEXT NOT NULL DEFAULT 'EMAIL' CHECK (channel IN ('EMAIL', 'SMS')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_org ON message_templates(organisation_id);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_templates_org_access" ON message_templates
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

CREATE TRIGGER set_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Guest Messages Log (R3) ───────────────────────────────
CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS')),
  recipient TEXT NOT NULL, -- email or phone
  subject TEXT DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_messages_reservation ON guest_messages(reservation_id);
CREATE INDEX IF NOT EXISTS idx_guest_messages_org ON guest_messages(organisation_id);

ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_messages_org_access" ON guest_messages
  FOR ALL USING (
    organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid())
  );

-- ── Guest Portal Tokens (R8) ──────────────────────────────
CREATE TABLE IF NOT EXISTS guest_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_portal_token ON guest_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_guest_portal_reservation ON guest_portal_tokens(reservation_id);

-- No RLS — public access via token
ALTER TABLE guest_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_portal_tokens_anon_read" ON guest_portal_tokens
  FOR SELECT USING (TRUE);

CREATE POLICY "guest_portal_tokens_auth_manage" ON guest_portal_tokens
  FOR ALL USING (
    reservation_id IN (
      SELECT r.id FROM reservations r
      JOIN profiles p ON p.organisation_id = r.organisation_id
      WHERE p.id = auth.uid()
    )
  );

-- ── Contrat auto-renewal (CO1) ─────────────────────────────
ALTER TABLE contrats ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;
ALTER TABLE contrats ADD COLUMN IF NOT EXISTS renewal_duration_months INTEGER DEFAULT 12;
ALTER TABLE contrats ADD COLUMN IF NOT EXISTS renewal_notified_at TIMESTAMPTZ;

-- ── Notifications: group_key for grouping (NO2) ───────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_key TEXT;
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON notifications(group_key) WHERE group_key IS NOT NULL;

-- ── Profile: email digest preference (NO5) + avatar (A3) ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_digest TEXT DEFAULT 'NONE' CHECK (email_digest IN ('NONE', 'QUOTIDIEN', 'HEBDOMADAIRE'));
-- avatar_url already exists on profiles

-- ── Insert default SLA configs ─────────────────────────────
-- These are defaults; each org can customize via UI.
-- We don't insert org-specific defaults here.
