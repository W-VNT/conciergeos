-- Migration: RLS policies pour le rôle PROPRIETAIRE
-- Un propriétaire peut voir uniquement ses logements, réservations et contrats

-- Fonction helper : retourne le proprietaire_id du profil connecté
CREATE OR REPLACE FUNCTION public.get_my_proprietaire_id()
RETURNS UUID AS $$
  SELECT proprietaire_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- LOGEMENTS : le propriétaire voit ses propres logements
-- ============================================================
DROP POLICY IF EXISTS "Proprietaires can view own logements" ON public.logements;
CREATE POLICY "Proprietaires can view own logements"
  ON public.logements FOR SELECT
  TO authenticated
  USING (
    owner_id IS NOT NULL
    AND owner_id = get_my_proprietaire_id()
  );

-- ============================================================
-- RESERVATIONS : le propriétaire voit les réservations de ses logements
-- ============================================================
DROP POLICY IF EXISTS "Proprietaires can view own reservations" ON public.reservations;
CREATE POLICY "Proprietaires can view own reservations"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    logement_id IN (
      SELECT id FROM public.logements
      WHERE owner_id = get_my_proprietaire_id()
    )
  );

-- ============================================================
-- CONTRATS : le propriétaire voit ses contrats
-- ============================================================
DROP POLICY IF EXISTS "Proprietaires can view own contrats" ON public.contrats;
CREATE POLICY "Proprietaires can view own contrats"
  ON public.contrats FOR SELECT
  TO authenticated
  USING (
    proprietaire_id = get_my_proprietaire_id()
  );

-- ============================================================
-- REVENUS : le propriétaire voit les revenus de ses logements
-- (si la table revenus existe déjà)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'revenus') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Proprietaires can view own revenus" ON public.revenus';
    EXECUTE '
      CREATE POLICY "Proprietaires can view own revenus"
        ON public.revenus FOR SELECT
        TO authenticated
        USING (
          logement_id IN (
            SELECT id FROM public.logements
            WHERE owner_id = get_my_proprietaire_id()
          )
        )
    ';
  END IF;
END $$;
