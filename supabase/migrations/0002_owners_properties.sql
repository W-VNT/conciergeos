-- ============================================================
-- ConciergeOS — Propriétaires & Logements
-- ============================================================

-- Enums
CREATE TYPE public.service_level AS ENUM ('STANDARD', 'VIP');
CREATE TYPE public.offer_tier AS ENUM ('ESSENTIEL', 'SERENITE', 'SIGNATURE');
CREATE TYPE public.logement_status AS ENUM ('ACTIF', 'PAUSE', 'ARCHIVE');

-- Propriétaires
CREATE TABLE public.proprietaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  service_level public.service_level NOT NULL DEFAULT 'STANDARD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proprietaires ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_proprietaires_org ON public.proprietaires(organisation_id);
CREATE INDEX idx_proprietaires_name ON public.proprietaires(full_name);

-- Logements
CREATE TABLE public.logements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.proprietaires(id) ON DELETE SET NULL,
  name text NOT NULL,
  address_line1 text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  offer_tier public.offer_tier NOT NULL DEFAULT 'ESSENTIEL',
  lockbox_code text,
  wifi_name text,
  wifi_password text,
  notes text,
  status public.logement_status NOT NULL DEFAULT 'ACTIF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.logements ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_logements_org ON public.logements(organisation_id);
CREATE INDEX idx_logements_owner ON public.logements(owner_id);
CREATE INDEX idx_logements_status ON public.logements(status);

-- ============================================================
-- RLS Policies — Propriétaires
-- ============================================================
CREATE POLICY "proprietaires_select" ON public.proprietaires FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "proprietaires_insert" ON public.proprietaires FOR INSERT
  WITH CHECK (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "proprietaires_update" ON public.proprietaires FOR UPDATE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "proprietaires_delete" ON public.proprietaires FOR DELETE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

-- ============================================================
-- RLS Policies — Logements
-- ============================================================
CREATE POLICY "logements_select" ON public.logements FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "logements_insert" ON public.logements FOR INSERT
  WITH CHECK (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "logements_update" ON public.logements FOR UPDATE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

CREATE POLICY "logements_delete" ON public.logements FOR DELETE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

-- ============================================================
-- Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_proprietaires_updated_at
  BEFORE UPDATE ON public.proprietaires
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_logements_updated_at
  BEFORE UPDATE ON public.logements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
