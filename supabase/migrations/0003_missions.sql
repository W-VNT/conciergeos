-- ============================================================
-- ConciergeOS — Missions + Automatisation
-- ============================================================

-- Enums
CREATE TYPE public.mission_type AS ENUM ('CHECKIN', 'CHECKOUT', 'MENAGE', 'INTERVENTION', 'URGENCE');
CREATE TYPE public.mission_status AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE');
CREATE TYPE public.mission_priority AS ENUM ('NORMALE', 'HAUTE', 'CRITIQUE');

-- Missions
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  logement_id uuid NOT NULL REFERENCES public.logements(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type public.mission_type NOT NULL,
  status public.mission_status NOT NULL DEFAULT 'A_FAIRE',
  priority public.mission_priority NOT NULL DEFAULT 'NORMALE',
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  time_spent_minutes int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_missions_org ON public.missions(organisation_id);
CREATE INDEX idx_missions_logement ON public.missions(logement_id);
CREATE INDEX idx_missions_assigned ON public.missions(assigned_to);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_scheduled ON public.missions(scheduled_at);
CREATE INDEX idx_missions_type_status ON public.missions(type, status);

-- ============================================================
-- RLS Policies — Missions (Admin + Operateur CRUD)
-- ============================================================
CREATE POLICY "missions_select" ON public.missions FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "missions_insert" ON public.missions FOR INSERT
  WITH CHECK (organisation_id = public.get_my_org_id());

CREATE POLICY "missions_update" ON public.missions FOR UPDATE
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "missions_delete" ON public.missions FOR DELETE
  USING (
    organisation_id = public.get_my_org_id()
    AND public.get_my_role() = 'ADMIN'
  );

-- Trigger updated_at
CREATE TRIGGER set_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Automatisation: CHECKOUT terminé → créer MENAGE
-- Règle: scheduled_at = completed_at + 2h
-- Anti-doublon: pas de MENAGE existant ±24h pour ce logement
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_create_menage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scheduled timestamptz;
  v_exists boolean;
BEGIN
  -- Only fire when CHECKOUT mission transitions to TERMINE
  IF NEW.type = 'CHECKOUT'
     AND NEW.status = 'TERMINE'
     AND (OLD.status IS DISTINCT FROM 'TERMINE')
  THEN
    -- Schedule ménage 2 hours after completion
    v_scheduled := COALESCE(NEW.completed_at, now()) + interval '2 hours';

    -- Check for existing MENAGE within ±24h for this logement
    SELECT EXISTS (
      SELECT 1 FROM public.missions
      WHERE logement_id = NEW.logement_id
        AND type = 'MENAGE'
        AND status != 'ANNULE'
        AND scheduled_at BETWEEN (v_scheduled - interval '24 hours')
                               AND (v_scheduled + interval '24 hours')
    ) INTO v_exists;

    IF NOT v_exists THEN
      INSERT INTO public.missions (
        organisation_id, logement_id, type, status, priority, scheduled_at
      ) VALUES (
        NEW.organisation_id, NEW.logement_id, 'MENAGE', 'A_FAIRE', 'NORMALE', v_scheduled
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_menage
  AFTER UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_menage();
