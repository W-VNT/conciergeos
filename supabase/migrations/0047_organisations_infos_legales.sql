-- ─── Migration 0047: Informations légales de l'organisation ──────────────────
-- Ajout des champs nécessaires pour la génération de contrats PDF
-- et l'identification légale de la conciergerie (mandataire)

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS address_line1   TEXT,
  ADD COLUMN IF NOT EXISTS postal_code     TEXT,
  ADD COLUMN IF NOT EXISTS siret           TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS statut_juridique TEXT;

COMMENT ON COLUMN organisations.siret IS 'SIRET ou SIREN de la société conciergerie';
COMMENT ON COLUMN organisations.statut_juridique IS 'Forme juridique : SARL, SAS, EURL, SCI, AUTRE';
