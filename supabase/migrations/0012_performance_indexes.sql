-- ============================================================
-- Performance: Index composés pour les requêtes fréquentes
-- ============================================================

-- Dashboard: Missions du jour (scheduled_at + organisation_id + status)
CREATE INDEX IF NOT EXISTS idx_missions_today_dashboard
  ON public.missions(organisation_id, scheduled_at, status)
  WHERE status != 'ANNULE';

-- Dashboard: Incidents ouverts (organisation_id + status + severity)
CREATE INDEX IF NOT EXISTS idx_incidents_open_dashboard
  ON public.incidents(organisation_id, status, severity, opened_at DESC)
  WHERE status IN ('OUVERT', 'EN_COURS');

-- Dashboard: Incidents résolus récents (organisation_id + resolved_at)
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_recent
  ON public.incidents(organisation_id, resolved_at DESC)
  WHERE resolved_at IS NOT NULL;

-- Missions list page: organisation + filters
CREATE INDEX IF NOT EXISTS idx_missions_list_filters
  ON public.missions(organisation_id, status, type, scheduled_at DESC);

-- Incidents list page: organisation + filters
CREATE INDEX IF NOT EXISTS idx_incidents_list_filters
  ON public.incidents(organisation_id, status, severity, opened_at DESC);

-- Logements list page: organisation + status + name search
CREATE INDEX IF NOT EXISTS idx_logements_list
  ON public.logements(organisation_id, status, name);

-- Improve join performance on foreign keys (if not already covered)
CREATE INDEX IF NOT EXISTS idx_missions_logement_assigned
  ON public.missions(logement_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_incidents_logement
  ON public.incidents(logement_id, prestataire_id);
