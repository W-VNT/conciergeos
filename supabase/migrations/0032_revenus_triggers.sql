-- Migration: Create triggers for automatic revenue calculation and creation
-- Description: Auto-calculate commissions and auto-create revenus from reservations

-- ============================================================
-- 1. Trigger: Calculate commission based on active contract
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_commission_for_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_logement_id UUID;
  v_contrat_id UUID;
  v_commission_rate DECIMAL(5, 2);
  v_commission_amount DECIMAL(10, 2);
  v_net_amount DECIMAL(10, 2);
BEGIN
  -- Récupérer logement_id de la réservation
  SELECT logement_id INTO v_logement_id
  FROM reservations
  WHERE id = NEW.reservation_id;

  -- Trouver le contrat ACTIF pour ce logement au moment du check-in
  SELECT id, commission_rate INTO v_contrat_id, v_commission_rate
  FROM contrats
  WHERE logement_id = v_logement_id
    AND status = 'ACTIF'
    AND NEW.date_checkin BETWEEN start_date AND end_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si pas de contrat trouvé, commission = 0
  IF v_contrat_id IS NULL THEN
    v_commission_rate := 0;
    v_commission_amount := 0;
    v_net_amount := NEW.montant_brut;
  ELSE
    -- Calculer commission et montant net
    v_commission_amount := ROUND(NEW.montant_brut * v_commission_rate / 100, 2);
    v_net_amount := NEW.montant_brut - v_commission_amount;
  END IF;

  -- Mettre à jour les champs calculés
  NEW.logement_id := v_logement_id;
  NEW.contrat_id := v_contrat_id;
  NEW.taux_commission := v_commission_rate;
  NEW.montant_commission := v_commission_amount;
  NEW.montant_net := v_net_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_commission
  BEFORE INSERT OR UPDATE ON revenus
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_for_reservation();

COMMENT ON FUNCTION calculate_commission_for_reservation IS 'Calcule automatiquement la commission basée sur le contrat actif au moment du check-in';


-- ============================================================
-- 2. Trigger: Auto-create revenu when reservation is confirmed
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_revenu()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer revenu automatiquement quand réservation CONFIRMEE avec montant
  IF NEW.status = 'CONFIRMEE' AND NEW.amount IS NOT NULL THEN
    INSERT INTO revenus (
      organisation_id,
      reservation_id,
      montant_brut,
      date_reservation,
      date_checkin,
      date_checkout
    ) VALUES (
      NEW.organisation_id,
      NEW.id,
      NEW.amount,
      CURRENT_DATE,
      NEW.check_in_date,
      NEW.check_out_date
    )
    ON CONFLICT (reservation_id) DO NOTHING;
  END IF;

  -- Supprimer le revenu si la réservation est annulée
  IF NEW.status = 'ANNULEE' AND OLD.status != 'ANNULEE' THEN
    DELETE FROM revenus WHERE reservation_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_revenu
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_revenu();

COMMENT ON FUNCTION auto_create_revenu IS 'Crée automatiquement un revenu quand une réservation est confirmée avec montant, et le supprime si annulée';


-- ============================================================
-- 3. Function: Sync existing reservations to revenus
-- ============================================================

CREATE OR REPLACE FUNCTION sync_existing_reservations_to_revenus()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert revenus for all confirmed reservations that don't have one yet
  INSERT INTO revenus (
    organisation_id,
    reservation_id,
    montant_brut,
    date_reservation,
    date_checkin,
    date_checkout
  )
  SELECT
    r.organisation_id,
    r.id,
    r.amount,
    r.created_at::DATE,
    r.check_in_date,
    r.check_out_date
  FROM reservations r
  LEFT JOIN revenus rev ON rev.reservation_id = r.id
  WHERE r.status = 'CONFIRMEE'
    AND r.amount IS NOT NULL
    AND rev.id IS NULL
  ON CONFLICT (reservation_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_existing_reservations_to_revenus IS 'Fonction manuelle pour synchroniser les réservations existantes vers la table revenus';

-- Execute sync for existing data
SELECT sync_existing_reservations_to_revenus();
