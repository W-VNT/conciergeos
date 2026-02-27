-- Sprint 1 schema changes
-- Migration: 0082_sprint1_schema.sql

-- ============================================================
-- IN1: Incident categories
-- ============================================================

DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM (
    'PLOMBERIE', 'ELECTRICITE', 'SERRURERIE', 'NUISIBLES',
    'ELECTROMENAGER', 'CHAUFFAGE_CLIM', 'DEGATS_DES_EAUX',
    'BRUIT_VOISINAGE', 'NETTOYAGE', 'AUTRE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category incident_category DEFAULT 'AUTRE';

-- ============================================================
-- R1: Reservation EN_ATTENTE status
-- ============================================================

ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'EN_ATTENTE' BEFORE 'CONFIRMEE';

-- ============================================================
-- R2: Payment tracking on reservations
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE', 'REMBOURSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'EN_ATTENTE';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_date DATE;

-- ============================================================
-- L4: Logement tags
-- ============================================================

ALTER TABLE logements ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_logements_tags ON logements USING GIN (tags);

-- ============================================================
-- MI3: Mission started_at for auto-timer
-- ============================================================

ALTER TABLE missions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- ============================================================
-- IN5: Incident response templates
-- ============================================================

CREATE TABLE IF NOT EXISTS incident_response_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category incident_category,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incident_response_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_can_read_templates" ON incident_response_templates;
CREATE POLICY "org_members_can_read_templates" ON incident_response_templates
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admins_can_manage_templates" ON incident_response_templates;
CREATE POLICY "admins_can_manage_templates" ON incident_response_templates
  FOR ALL USING (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  ) WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE INDEX IF NOT EXISTS idx_incident_templates_org ON incident_response_templates(organisation_id);
