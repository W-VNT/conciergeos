-- Fix: Enable RLS on tables that have policies but RLS disabled
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_checklist_items ENABLE ROW LEVEL SECURITY;

-- Fix: Recreate views with SECURITY INVOKER (default) instead of SECURITY DEFINER
CREATE OR REPLACE VIEW revenus_mensuels
WITH (security_invoker = true)
AS
SELECT
  organisation_id,
  logement_id,
  DATE_TRUNC('month', date_checkin)::DATE AS mois,
  COUNT(*) AS nb_reservations,
  SUM(montant_brut) AS revenus_brut,
  SUM(montant_commission) AS commissions,
  SUM(montant_net) AS revenus_net,
  AVG(taux_commission) AS taux_moyen
FROM revenus
GROUP BY organisation_id, logement_id, DATE_TRUNC('month', date_checkin);

CREATE OR REPLACE VIEW revenus_mensuels_global
WITH (security_invoker = true)
AS
SELECT
  organisation_id,
  DATE_TRUNC('month', date_checkin)::DATE AS mois,
  COUNT(*) AS nb_reservations,
  SUM(montant_brut) AS revenus_brut,
  SUM(montant_commission) AS commissions,
  SUM(montant_net) AS revenus_net,
  AVG(taux_commission) AS taux_moyen
FROM revenus
GROUP BY organisation_id, DATE_TRUNC('month', date_checkin);

CREATE OR REPLACE VIEW revenus_par_logement
WITH (security_invoker = true)
AS
SELECT
  r.organisation_id,
  r.logement_id,
  l.name AS logement_name,
  l.city AS logement_city,
  COUNT(*) AS nb_reservations,
  SUM(r.montant_brut) AS total_brut,
  AVG(r.taux_commission) AS taux_commission_moyen,
  SUM(r.montant_commission) AS total_commissions,
  SUM(r.montant_net) AS total_net
FROM revenus r
LEFT JOIN logements l ON l.id = r.logement_id
GROUP BY r.organisation_id, r.logement_id, l.name, l.city;
