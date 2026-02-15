-- Migration: Create aggregated views for performance
-- Description: Pre-aggregated monthly views for revenus and charges

-- ============================================================
-- 1. Vue: Revenus mensuels par logement
-- ============================================================

CREATE OR REPLACE VIEW revenus_mensuels AS
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

COMMENT ON VIEW revenus_mensuels IS 'Agrégation mensuelle des revenus par logement pour performances';


-- ============================================================
-- 2. Vue: Revenus mensuels globaux (tous logements)
-- ============================================================

CREATE OR REPLACE VIEW revenus_mensuels_global AS
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

COMMENT ON VIEW revenus_mensuels_global IS 'Agrégation mensuelle des revenus tous logements confondus';


-- ============================================================
-- 3. Vue: Charges mensuelles (pour Phase 3 - factures prestataires)
-- ============================================================
-- Note: This view will error until factures_prestataires table is created in migration 0034
-- We create it now for completeness but it will only work after Phase 3

-- CREATE OR REPLACE VIEW charges_mensuelles AS
-- SELECT
--   organisation_id,
--   DATE_TRUNC('month', date_emission)::DATE AS mois,
--   COUNT(*) AS nb_factures,
--   SUM(montant) AS total_charges,
--   SUM(CASE WHEN status = 'PAYEE' THEN montant ELSE 0 END) AS charges_payees,
--   SUM(CASE WHEN status IN ('ATTENTE', 'VALIDEE') THEN montant ELSE 0 END) AS charges_attente
-- FROM factures_prestataires
-- GROUP BY organisation_id, DATE_TRUNC('month', date_emission);

-- COMMENT ON VIEW charges_mensuelles IS 'Agrégation mensuelle des charges (factures prestataires)';


-- ============================================================
-- 4. Vue: Résumé financier par logement (pour tableau revenus)
-- ============================================================

CREATE OR REPLACE VIEW revenus_par_logement AS
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

COMMENT ON VIEW revenus_par_logement IS 'Résumé des revenus par logement (tous temps)';


-- ============================================================
-- 5. Function: Get revenus for date range (helper for server actions)
-- ============================================================

CREATE OR REPLACE FUNCTION get_revenus_summary(
  p_organisation_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_brut DECIMAL(10, 2),
  total_commissions DECIMAL(10, 2),
  total_net DECIMAL(10, 2),
  nb_reservations BIGINT,
  taux_moyen DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(montant_brut), 0)::DECIMAL(10, 2),
    COALESCE(SUM(montant_commission), 0)::DECIMAL(10, 2),
    COALESCE(SUM(montant_net), 0)::DECIMAL(10, 2),
    COUNT(*)::BIGINT,
    COALESCE(AVG(taux_commission), 0)::DECIMAL(5, 2)
  FROM revenus
  WHERE organisation_id = p_organisation_id
    AND date_checkin >= p_start_date
    AND date_checkin <= p_end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_revenus_summary IS 'Helper function pour obtenir résumé revenus sur une période';
