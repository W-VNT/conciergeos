-- Migration: Ajout du rôle PROPRIETAIRE et colonnes de liaison

-- 1. Ajouter le rôle PROPRIETAIRE à l'enum user_role (skip if exists)
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE 'PROPRIETAIRE';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ajouter proprietaire_id dans profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE SET NULL;

-- 3. Ajouter proprietaire_id dans invitations
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_proprietaire ON profiles(proprietaire_id) WHERE proprietaire_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_proprietaire ON invitations(proprietaire_id) WHERE proprietaire_id IS NOT NULL;
