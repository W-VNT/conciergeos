-- Migration: 0088_indexes_and_constraints.sql
-- Fix missing indexes and UNIQUE constraints identified during audit

-- ============================================================
-- 1. Missing indexes on organisation_id
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prestataire_availability_org
  ON prestataire_availability (organisation_id);

CREATE INDEX IF NOT EXISTS idx_prestataire_blackouts_org
  ON prestataire_blackouts (organisation_id);

-- ============================================================
-- 2. Missing indexes on optional FK columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_devis_prestataires_incident
  ON devis_prestataires (incident_id) WHERE incident_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devis_prestataires_mission
  ON devis_prestataires (mission_id) WHERE mission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factures_prestataires_incident
  ON factures_prestataires (incident_id) WHERE incident_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factures_prestataires_mission
  ON factures_prestataires (mission_id) WHERE mission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_mission
  ON stock_movements (mission_id) WHERE mission_id IS NOT NULL;

-- ============================================================
-- 3. Missing UNIQUE constraints to prevent duplicates
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_seasons_org_logement_name
  ON pricing_seasons (organisation_id, logement_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_org_name_type
  ON message_templates (organisation_id, name, type);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mission_recurrences_org_logement_type
  ON mission_recurrences (organisation_id, logement_id, type);
