-- ============================================================
-- Onboarding: Ajouter champs à la table organisations
-- ============================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Marquer les orgs existantes comme onboardées (pour ne pas casser l'existant)
UPDATE public.organisations SET onboarding_completed = true WHERE onboarding_completed = false;
