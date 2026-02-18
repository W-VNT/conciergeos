-- Normalize proprietaire full_name to title case (e.g. "JEAN DUPONT" → "Jean Dupont")
-- PostgreSQL's initcap handles spaces and hyphens correctly
UPDATE proprietaires
SET full_name = initcap(lower(full_name))
WHERE full_name IS NOT NULL
  AND full_name != initcap(lower(full_name));
