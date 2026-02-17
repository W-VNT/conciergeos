-- ─── Migration 0046: Amélioration table propriétaires ──────────────────────────
-- Suppression service_level (redondant avec offer_tier sur logements)
-- Ajout : adresse facturation, statut juridique, SIRET

-- 1. Créer l'enum statut juridique
CREATE TYPE statut_juridique AS ENUM (
  'PARTICULIER',
  'SCI',
  'SARL',
  'SAS',
  'EURL',
  'AUTRE'
);

-- 2. Supprimer service_level
ALTER TABLE proprietaires
  DROP COLUMN IF EXISTS service_level;

-- 3. Ajouter les nouvelles colonnes
ALTER TABLE proprietaires
  ADD COLUMN IF NOT EXISTS address_line1    TEXT,
  ADD COLUMN IF NOT EXISTS postal_code      TEXT,
  ADD COLUMN IF NOT EXISTS city             TEXT,
  ADD COLUMN IF NOT EXISTS statut_juridique statut_juridique NOT NULL DEFAULT 'PARTICULIER',
  ADD COLUMN IF NOT EXISTS siret            TEXT;
