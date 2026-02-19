-- Migration: Ajout du rôle PROPRIETAIRE et colonnes de liaison

-- 1. Ajouter le rôle PROPRIETAIRE à l'enum user_role
ALTER TYPE user_role ADD VALUE 'PROPRIETAIRE';

-- 2. Ajouter proprietaire_id dans profiles
--    Lien entre le compte auth du propriétaire et sa fiche propriétaire
ALTER TABLE profiles
  ADD COLUMN proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE SET NULL;

-- 3. Ajouter proprietaire_id dans invitations
--    Transmis lors de l'onboarding pour créer le profil avec le bon lien
ALTER TABLE invitations
  ADD COLUMN proprietaire_id UUID REFERENCES proprietaires(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_profiles_proprietaire ON profiles(proprietaire_id) WHERE proprietaire_id IS NOT NULL;
CREATE INDEX idx_invitations_proprietaire ON invitations(proprietaire_id) WHERE proprietaire_id IS NOT NULL;
