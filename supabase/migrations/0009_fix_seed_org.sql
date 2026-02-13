-- ============================================================
-- Fix: Réassigner toutes les données seed à l'organisation du profil utilisateur
-- Problème: le seed a pu utiliser une org différente de celle de l'utilisateur
-- ============================================================

DO $$
DECLARE
  v_user_org_id uuid;
  v_seed_org_id uuid;
  v_org_count int;
BEGIN
  -- Nombre d'organisations
  SELECT count(*) INTO v_org_count FROM public.organisations;
  RAISE NOTICE 'Nombre d''organisations: %', v_org_count;

  -- L'org liée au profil utilisateur
  SELECT organisation_id INTO v_user_org_id FROM public.profiles LIMIT 1;
  RAISE NOTICE 'Org du profil utilisateur: %', v_user_org_id;

  -- Si une seule org ou pas de profil, rien à faire côté réassignation
  IF v_org_count <= 1 OR v_user_org_id IS NULL THEN
    RAISE NOTICE 'Pas de conflit d''organisation détecté.';

    -- Vérifier les données
    PERFORM 1 FROM public.proprietaires LIMIT 1;
    IF NOT FOUND THEN
      RAISE NOTICE 'ATTENTION: Aucun propriétaire trouvé !';
    END IF;

    PERFORM 1 FROM public.missions LIMIT 1;
    IF NOT FOUND THEN
      RAISE NOTICE 'ATTENTION: Aucune mission trouvée !';
    END IF;

    RETURN;
  END IF;

  -- Trouver l'org du seed (celle qui a des propriétaires mais n'est PAS celle du profil)
  SELECT DISTINCT organisation_id INTO v_seed_org_id
  FROM public.proprietaires
  WHERE organisation_id != v_user_org_id
  LIMIT 1;

  IF v_seed_org_id IS NOT NULL THEN
    RAISE NOTICE 'Org du seed: % -> Réassignation vers org utilisateur: %', v_seed_org_id, v_user_org_id;

    -- Réassigner toutes les données
    UPDATE public.proprietaires SET organisation_id = v_user_org_id WHERE organisation_id = v_seed_org_id;
    UPDATE public.logements SET organisation_id = v_user_org_id WHERE organisation_id = v_seed_org_id;
    UPDATE public.missions SET organisation_id = v_user_org_id WHERE organisation_id = v_seed_org_id;
    UPDATE public.prestataires SET organisation_id = v_user_org_id WHERE organisation_id = v_seed_org_id;
    UPDATE public.incidents SET organisation_id = v_user_org_id WHERE organisation_id = v_seed_org_id;

    -- Supprimer l'org orpheline
    DELETE FROM public.organisations WHERE id = v_seed_org_id;

    RAISE NOTICE 'Réassignation terminée.';
  ELSE
    RAISE NOTICE 'Toutes les données sont déjà dans la bonne organisation.';
  END IF;

  -- Vérifications finales
  RAISE NOTICE 'Propriétaires: %', (SELECT count(*) FROM public.proprietaires WHERE organisation_id = v_user_org_id);
  RAISE NOTICE 'Logements: %', (SELECT count(*) FROM public.logements WHERE organisation_id = v_user_org_id);
  RAISE NOTICE 'Missions: %', (SELECT count(*) FROM public.missions WHERE organisation_id = v_user_org_id);
  RAISE NOTICE 'Prestataires: %', (SELECT count(*) FROM public.prestataires WHERE organisation_id = v_user_org_id);
  RAISE NOTICE 'Incidents: %', (SELECT count(*) FROM public.incidents WHERE organisation_id = v_user_org_id);
END;
$$;
