-- ============================================================
-- Sprint 5 — Qualité, Compliance & Documents
-- ============================================================

-- A7: Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_org_access" ON audit_logs
  FOR ALL USING (organisation_id = get_my_org_id());

-- A8: 2FA / MFA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- R17: État des lieux
CREATE TABLE IF NOT EXISTS etats_des_lieux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ENTREE', 'SORTIE')),
  status TEXT NOT NULL DEFAULT 'BROUILLON' CHECK (status IN ('BROUILLON', 'SIGNE', 'VALIDE')),
  inspector_id UUID REFERENCES profiles(id),
  guest_signature_url TEXT,
  inspector_signature_url TEXT,
  notes TEXT DEFAULT '',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edl_org ON etats_des_lieux(organisation_id);
CREATE INDEX IF NOT EXISTS idx_edl_logement ON etats_des_lieux(logement_id);

ALTER TABLE etats_des_lieux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edl_org_access" ON etats_des_lieux
  FOR ALL USING (organisation_id = get_my_org_id());

CREATE TABLE IF NOT EXISTS etat_des_lieux_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etat_des_lieux_id UUID NOT NULL REFERENCES etats_des_lieux(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  element TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('BON', 'CORRECT', 'DEGRADE', 'MAUVAIS')),
  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE etat_des_lieux_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edl_items_access" ON etat_des_lieux_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM etats_des_lieux e
      WHERE e.id = etat_des_lieux_items.etat_des_lieux_id
      AND e.organisation_id = get_my_org_id()
    )
  );

-- R22 + MI18: Webhooks
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_org_access" ON webhook_endpoints
  FOR ALL USING (organisation_id = get_my_org_id());

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries_access" ON webhook_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM webhook_endpoints w
      WHERE w.id = webhook_deliveries.webhook_id
      AND w.organisation_id = get_my_org_id()
    )
  );

-- MI10: Mission Reports
CREATE TABLE IF NOT EXISTS mission_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'SOUMIS' CHECK (status IN ('SOUMIS', 'VALIDE', 'REJETE')),
  checklist JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  issues_found TEXT DEFAULT '',
  supplies_used JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mission_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission_reports_org_access" ON mission_reports
  FOR ALL USING (organisation_id = get_my_org_id());

-- MI17: Mission Templates
CREATE TABLE IF NOT EXISTS mission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logement_id UUID REFERENCES logements(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  estimated_duration_minutes INTEGER,
  checklist JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'NORMALE',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mission_templates_org_access" ON mission_templates
  FOR ALL USING (organisation_id = get_my_org_id());

-- IN11: Public Incident Reporting
ALTER TABLE logements ADD COLUMN IF NOT EXISTS incident_report_token TEXT;

-- IN12: Intervention Checklists
CREATE TABLE IF NOT EXISTS intervention_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE intervention_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intervention_checklists_org_access" ON intervention_checklists
  FOR ALL USING (organisation_id = get_my_org_id());

-- CO7: Contract Templates
CREATE TABLE IF NOT EXISTS contrat_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]',
  category TEXT DEFAULT 'GENERAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contrat_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrat_templates_org_access" ON contrat_templates
  FOR ALL USING (organisation_id = get_my_org_id());

-- CO8: Contract Versioning
CREATE TABLE IF NOT EXISTS contrat_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrat_id UUID NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL DEFAULT '{}',
  changed_by UUID REFERENCES profiles(id),
  change_summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contrat_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrat_versions_org_access" ON contrat_versions
  FOR ALL USING (organisation_id = get_my_org_id());

-- FI8: Owner Payments
CREATE TABLE IF NOT EXISTS owner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  contrat_id UUID REFERENCES contrats(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'DU' CHECK (status IN ('DU', 'PAYE', 'PARTIEL', 'EN_RETARD')),
  paid_amount NUMERIC(12,2) DEFAULT 0,
  paid_at DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE owner_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_payments_org_access" ON owner_payments
  FOR ALL USING (organisation_id = get_my_org_id());

-- PR7: Prestataire Documents
CREATE TABLE IF NOT EXISTS prestataire_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CERTIFICATION', 'ASSURANCE', 'KBIS', 'RIB', 'AUTRE')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expires_at DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prestataire_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prestataire_documents_org_access" ON prestataire_documents
  FOR ALL USING (organisation_id = get_my_org_id());

-- PO6: Proprietaire Documents
CREATE TABLE IF NOT EXISTS proprietaire_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IDENTITE', 'DIAGNOSTIC', 'TITRE_PROPRIETE', 'ASSURANCE', 'RIB', 'AUTRE')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expires_at DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proprietaire_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proprietaire_documents_org_access" ON proprietaire_documents
  FOR ALL USING (organisation_id = get_my_org_id());

-- R22: Public API — reservations table already has RLS, we'll use API keys via webhook_endpoints.secret
