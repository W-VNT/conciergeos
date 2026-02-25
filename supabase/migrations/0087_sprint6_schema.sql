-- ============================================================
-- Sprint 6 — Premium & Intelligence
-- ============================================================

-- MI13: Marketplace Prestataires
ALTER TABLE missions ADD COLUMN IF NOT EXISTS open_for_bids BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS open_for_bids BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS marketplace_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  proposed_price NUMERIC(12,2) NOT NULL CHECK (proposed_price >= 0),
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'ACCEPTE', 'REFUSE')),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((mission_id IS NOT NULL AND incident_id IS NULL) OR (mission_id IS NULL AND incident_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_marketplace_bids_org ON marketplace_bids(organisation_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bids_mission ON marketplace_bids(mission_id) WHERE mission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_bids_incident ON marketplace_bids(incident_id) WHERE incident_id IS NOT NULL;

ALTER TABLE marketplace_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_bids_org_access" ON marketplace_bids
  FOR ALL USING (organisation_id = get_my_org_id());

-- MI14: Gamification
CREATE TABLE IF NOT EXISTS operator_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_operator_points_org ON operator_points(organisation_id);
CREATE INDEX IF NOT EXISTS idx_operator_points_operator ON operator_points(operator_id);

ALTER TABLE operator_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_points_org_access" ON operator_points
  FOR ALL USING (organisation_id = get_my_org_id());

CREATE TABLE IF NOT EXISTS operator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, operator_id, badge_code)
);

ALTER TABLE operator_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator_badges_org_access" ON operator_badges
  FOR ALL USING (organisation_id = get_my_org_id());

-- MI16: Stock Consommables
ALTER TABLE equipements ADD COLUMN IF NOT EXISTS seuil_alerte INTEGER;
ALTER TABLE equipements ADD COLUMN IF NOT EXISTS unite TEXT DEFAULT 'unité';

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  equipement_id UUID NOT NULL REFERENCES equipements(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ENTREE', 'SORTIE', 'AJUSTEMENT')),
  quantite INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organisation_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_equipement ON stock_movements(equipement_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_org_access" ON stock_movements
  FOR ALL USING (organisation_id = get_my_org_id());

-- IN13: Maintenance Préventive
CREATE TABLE IF NOT EXISTS preventive_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'AUTRE',
  severity TEXT NOT NULL DEFAULT 'MINEUR' CHECK (severity IN ('MINEUR', 'MOYEN', 'CRITIQUE')),
  frequency TEXT NOT NULL CHECK (frequency IN ('HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL')),
  day_of_week INTEGER,
  day_of_month INTEGER,
  next_due_date DATE NOT NULL,
  last_generated_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_preventive_schedules_org ON preventive_schedules(organisation_id);
CREATE INDEX IF NOT EXISTS idx_preventive_schedules_logement ON preventive_schedules(logement_id);
CREATE INDEX IF NOT EXISTS idx_preventive_schedules_due ON preventive_schedules(next_due_date) WHERE active = true;

ALTER TABLE preventive_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preventive_schedules_org_access" ON preventive_schedules
  FOR ALL USING (organisation_id = get_my_org_id());

-- IN15: Assurance & Garantie
CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID REFERENCES logements(id) ON DELETE CASCADE,
  equipement_id UUID REFERENCES equipements(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('GARANTIE', 'ASSURANCE')),
  provider TEXT NOT NULL,
  policy_number TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  coverage_details TEXT DEFAULT '',
  annual_cost NUMERIC(12,2),
  contact_info TEXT DEFAULT '',
  document_url TEXT,
  alert_days_before INTEGER NOT NULL DEFAULT 30,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warranties_org ON warranties(organisation_id);
CREATE INDEX IF NOT EXISTS idx_warranties_logement ON warranties(logement_id);
CREATE INDEX IF NOT EXISTS idx_warranties_end ON warranties(end_date);

ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warranties_org_access" ON warranties
  FOR ALL USING (organisation_id = get_my_org_id());

-- FI9: Réconciliation Plateformes
CREATE TABLE IF NOT EXISTS platform_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('AIRBNB', 'BOOKING', 'DIRECT', 'AUTRE')),
  reference TEXT DEFAULT '',
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  reconciliation_status TEXT NOT NULL DEFAULT 'NON_RAPPROCHE' CHECK (reconciliation_status IN ('NON_RAPPROCHE', 'RAPPROCHE', 'ECART')),
  ecart_amount NUMERIC(12,2),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_payments_org ON platform_payments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_reservation ON platform_payments(reservation_id);

ALTER TABLE platform_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_payments_org_access" ON platform_payments
  FOR ALL USING (organisation_id = get_my_org_id());

-- FI10: Budget & Prévisions
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  logement_id UUID REFERENCES logements(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER,
  category TEXT NOT NULL DEFAULT 'GLOBAL' CHECK (category IN ('GLOBAL', 'REVENUS', 'CHARGES', 'MAINTENANCE')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, logement_id, year, month, category)
);
CREATE INDEX IF NOT EXISTS idx_budgets_org ON budgets(organisation_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_org_access" ON budgets
  FOR ALL USING (organisation_id = get_my_org_id());

-- FI11: TVA / Fiscalité
CREATE TABLE IF NOT EXISTS tva_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tva_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tva_configs_org_access" ON tva_configs
  FOR ALL USING (organisation_id = get_my_org_id());

ALTER TABLE revenus ADD COLUMN IF NOT EXISTS tva_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE revenus ADD COLUMN IF NOT EXISTS tva_amount NUMERIC(12,2) DEFAULT 0;

-- FI13: Multi-devise
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL CHECK (char_length(from_currency) = 3),
  to_currency TEXT NOT NULL CHECK (char_length(to_currency) = 3),
  rate NUMERIC(12,6) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, from_currency, to_currency, effective_date)
);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_org ON exchange_rates(organisation_id);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_org_access" ON exchange_rates
  FOR ALL USING (organisation_id = get_my_org_id());

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS amount_eur NUMERIC(12,2);
ALTER TABLE revenus ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE revenus ADD COLUMN IF NOT EXISTS montant_brut_eur NUMERIC(12,2);
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'EUR';

-- CO9: Multi-logement contrat
CREATE TABLE IF NOT EXISTS contrat_logements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrat_id UUID NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
  logement_id UUID NOT NULL REFERENCES logements(id) ON DELETE CASCADE,
  commission_rate NUMERIC(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contrat_id, logement_id)
);
CREATE INDEX IF NOT EXISTS idx_contrat_logements_contrat ON contrat_logements(contrat_id);
CREATE INDEX IF NOT EXISTS idx_contrat_logements_logement ON contrat_logements(logement_id);

ALTER TABLE contrat_logements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrat_logements_access" ON contrat_logements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contrats c
      WHERE c.id = contrat_logements.contrat_id
      AND c.organisation_id = get_my_org_id()
    )
  );

-- PR4: Calendrier disponibilité prestataire
CREATE TABLE IF NOT EXISTS prestataire_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (start_time < end_time),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prestataire_avail_presta ON prestataire_availability(prestataire_id);

ALTER TABLE prestataire_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prestataire_availability_org_access" ON prestataire_availability
  FOR ALL USING (organisation_id = get_my_org_id());

CREATE TABLE IF NOT EXISTS prestataire_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES prestataires(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  CHECK (start_date <= end_date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prestataire_blackouts_presta ON prestataire_blackouts(prestataire_id);

ALTER TABLE prestataire_blackouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prestataire_blackouts_org_access" ON prestataire_blackouts
  FOR ALL USING (organisation_id = get_my_org_id());
