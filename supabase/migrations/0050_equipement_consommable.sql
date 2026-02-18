-- Add CONSOMMABLE category to equipement_categorie enum
-- Used for items to bring to a ménage (papier WC, gel douche, produits ménagers, etc.)
ALTER TYPE equipement_categorie ADD VALUE IF NOT EXISTS 'CONSOMMABLE';
