-- ─── Migration 0048: Statut SIGNE pour les contrats ──────────────────────────
-- Ajoute le statut SIGNE et la colonne pdf_downloaded_at

-- Ajouter SIGNE à l'enum (idempotent en PostgreSQL 12+)
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'SIGNE';

-- Ajouter la colonne de traçabilité du téléchargement PDF
ALTER TABLE contrats
  ADD COLUMN IF NOT EXISTS pdf_downloaded_at TIMESTAMPTZ;

COMMENT ON COLUMN contrats.pdf_downloaded_at IS 'Date du premier téléchargement PDF — verrouille le contrat en modification';
COMMENT ON COLUMN contrats.status IS 'ACTIF/EXPIRE/RESILIE/SIGNE - SIGNE = PDF téléchargé, contrat verrouillé';

-- Mettre à jour le trigger pour ne pas écraser le statut SIGNE
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne pas toucher aux contrats résiliés ou signés
  IF NEW.status != 'RESILIE' AND NEW.status != 'SIGNE' THEN
    IF NEW.end_date < CURRENT_DATE THEN
      NEW.status := 'EXPIRE';
    ELSE
      NEW.status := 'ACTIF';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
