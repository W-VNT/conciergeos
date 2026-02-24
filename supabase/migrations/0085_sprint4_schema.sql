-- ============================================================
-- Sprint 4: Portails & Avancé
-- ============================================================

-- ── A5: Add MANAGER role ─────────────────────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER';

-- ── R15: Voyageurs CRM ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS voyageurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(full_name) <= 200),
  email TEXT,
  phone TEXT CHECK (char_length(phone) <= 30),
  language TEXT CHECK (char_length(language) <= 10),
  nationality TEXT CHECK (char_length(nationality) <= 100),
  notes TEXT DEFAULT '',
  preferences JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  total_stays INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voyageurs_org ON voyageurs(organisation_id);
CREATE INDEX IF NOT EXISTS idx_voyageurs_email ON voyageurs(organisation_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voyageurs_unique_email
  ON voyageurs(organisation_id, email) WHERE email IS NOT NULL AND email != '';

ALTER TABLE voyageurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voyageurs_org_select" ON voyageurs
  FOR SELECT USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "voyageurs_org_insert" ON voyageurs
  FOR INSERT WITH CHECK (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "voyageurs_org_update" ON voyageurs
  FOR UPDATE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "voyageurs_org_delete" ON voyageurs
  FOR DELETE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER set_voyageurs_updated_at
  BEFORE UPDATE ON voyageurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Link reservations to voyageurs
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS voyageur_id UUID REFERENCES voyageurs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_voyageur ON reservations(voyageur_id) WHERE voyageur_id IS NOT NULL;

-- ── MI8: Géolocalisation missions ────────────────────────────
ALTER TABLE missions ADD COLUMN IF NOT EXISTS check_in_lat DOUBLE PRECISION;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS check_in_lng DOUBLE PRECISION;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS check_out_lat DOUBLE PRECISION;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS check_out_lng DOUBLE PRECISION;

-- ── MI12: Mission dependencies ───────────────────────────────
ALTER TABLE missions ADD COLUMN IF NOT EXISTS depends_on_mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_missions_depends_on ON missions(depends_on_mission_id) WHERE depends_on_mission_id IS NOT NULL;

-- ── IN7: Prestataire portal tokens ───────────────────────────
CREATE TABLE IF NOT EXISTS prestataire_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prestataire_portal_token ON prestataire_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prestataire_portal_presta ON prestataire_portal_tokens(prestataire_id);

ALTER TABLE prestataire_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prestataire_portal_tokens_anon_read" ON prestataire_portal_tokens
  FOR SELECT USING (true);
CREATE POLICY "prestataire_portal_tokens_auth_manage" ON prestataire_portal_tokens
  FOR ALL USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

-- ── IN8: Devis prestataire ───────────────────────────────────
CREATE TABLE IF NOT EXISTS devis_prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'SOUMIS' CHECK (status IN ('SOUMIS', 'ACCEPTE', 'REFUSE')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devis_org ON devis_prestataires(organisation_id);
CREATE INDEX IF NOT EXISTS idx_devis_prestataire ON devis_prestataires(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_incident ON devis_prestataires(incident_id) WHERE incident_id IS NOT NULL;

ALTER TABLE devis_prestataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devis_prestataires_org_select" ON devis_prestataires
  FOR SELECT USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "devis_prestataires_org_insert" ON devis_prestataires
  FOR INSERT WITH CHECK (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "devis_prestataires_org_update" ON devis_prestataires
  FOR UPDATE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "devis_prestataires_org_delete" ON devis_prestataires
  FOR DELETE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER set_devis_prestataires_updated_at
  BEFORE UPDATE ON devis_prestataires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── IN8: Factures prestataire ────────────────────────────────
-- Note: FacturePrestataire type already exists in code, ensure table exists
CREATE TABLE IF NOT EXISTS factures_prestataires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  devis_id UUID REFERENCES devis_prestataires(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  numero_facture TEXT,
  montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  status TEXT NOT NULL DEFAULT 'ATTENTE' CHECK (status IN ('ATTENTE', 'VALIDEE', 'PAYEE', 'REFUSEE')),
  date_paiement DATE,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_presta_org ON factures_prestataires(organisation_id);
CREATE INDEX IF NOT EXISTS idx_factures_presta_presta ON factures_prestataires(prestataire_id);

ALTER TABLE factures_prestataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factures_prestataires_org_select" ON factures_prestataires
  FOR SELECT USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "factures_prestataires_org_insert" ON factures_prestataires
  FOR INSERT WITH CHECK (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "factures_prestataires_org_update" ON factures_prestataires
  FOR UPDATE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "factures_prestataires_org_delete" ON factures_prestataires
  FOR DELETE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));

CREATE TRIGGER set_factures_prestataires_updated_at
  BEFORE UPDATE ON factures_prestataires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── NO6: Trigger event on message templates ──────────────────
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS trigger_event TEXT;

-- ── PO4: Owner-admin messages ────────────────────────────────
CREATE TABLE IF NOT EXISTS owner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES proprietaires(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('ADMIN', 'OWNER')),
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_messages_org ON owner_messages(organisation_id);
CREATE INDEX IF NOT EXISTS idx_owner_messages_proprio ON owner_messages(proprietaire_id);

ALTER TABLE owner_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_messages_org_select" ON owner_messages
  FOR SELECT USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "owner_messages_org_insert" ON owner_messages
  FOR INSERT WITH CHECK (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "owner_messages_org_update" ON owner_messages
  FOR UPDATE USING (organisation_id IN (SELECT organisation_id FROM profiles WHERE id = auth.uid()));
