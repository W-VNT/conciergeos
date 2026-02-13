-- ============================================================
-- ConciergeOS — Prestataires & Incidents
-- ============================================================

-- Enums
CREATE TYPE public.specialty AS ENUM ('MENAGE', 'PLOMBERIE', 'ELECTRICITE', 'CLIM', 'AUTRE');
CREATE TYPE public.incident_severity AS ENUM ('MINEUR', 'MOYEN', 'CRITIQUE');
CREATE TYPE public.incident_status AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU', 'CLOS');

-- Prestataires
CREATE TABLE public.prestataires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  specialty public.specialty NOT NULL DEFAULT 'AUTRE',
  phone text,
  email text,
  zone text,
  hourly_rate numeric,
  reliability_score int CHECK (reliability_score IS NULL OR (reliability_score >= 1 AND reliability_score <= 5)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prestataires ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_prestataires_org ON public.prestataires(organisation_id);
CREATE INDEX idx_prestataires_specialty ON public.prestataires(specialty);

-- Incidents
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  logement_id uuid NOT NULL REFERENCES public.logements(id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  prestataire_id uuid REFERENCES public.prestataires(id) ON DELETE SET NULL,
  severity public.incident_severity NOT NULL DEFAULT 'MINEUR',
  status public.incident_status NOT NULL DEFAULT 'OUVERT',
  description text NOT NULL,
  cost numeric,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_incidents_org ON public.incidents(organisation_id);
CREATE INDEX idx_incidents_logement ON public.incidents(logement_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_incidents_opened ON public.incidents(opened_at);
CREATE INDEX idx_incidents_status_severity ON public.incidents(status, severity);

-- ============================================================
-- RLS — Prestataires (Admin CRUD, Operateur read-only)
-- ============================================================
CREATE POLICY "prestataires_select" ON public.prestataires FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "prestataires_insert" ON public.prestataires FOR INSERT
  WITH CHECK (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "prestataires_update" ON public.prestataires FOR UPDATE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "prestataires_delete" ON public.prestataires FOR DELETE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

-- ============================================================
-- RLS — Incidents (Admin + Operateur CRUD)
-- ============================================================
CREATE POLICY "incidents_select" ON public.incidents FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "incidents_insert" ON public.incidents FOR INSERT
  WITH CHECK (organisation_id = public.get_my_org_id());

CREATE POLICY "incidents_update" ON public.incidents FOR UPDATE
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "incidents_delete" ON public.incidents FOR DELETE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

-- Triggers updated_at
CREATE TRIGGER set_prestataires_updated_at
  BEFORE UPDATE ON public.prestataires
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
