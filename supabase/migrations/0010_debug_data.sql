DO $$
BEGIN
  RAISE NOTICE 'Missions count: %', (SELECT count(*) FROM public.missions);
  RAISE NOTICE 'Missions org: %', (SELECT DISTINCT organisation_id FROM public.missions LIMIT 1);
  RAISE NOTICE 'Profile org: %', (SELECT organisation_id FROM public.profiles LIMIT 1);
  RAISE NOTICE 'Profile id: %', (SELECT id FROM public.profiles LIMIT 1);
  RAISE NOTICE 'Missions assigned_to: %', (SELECT DISTINCT assigned_to FROM public.missions LIMIT 1);
  RAISE NOTICE 'get_my_org_id for profile: %', (SELECT organisation_id FROM public.profiles LIMIT 1);
  RAISE NOTICE 'Proprietaires count: %', (SELECT count(*) FROM public.proprietaires);
  RAISE NOTICE 'Logements count: %', (SELECT count(*) FROM public.logements);
  RAISE NOTICE 'Missions today: %', (SELECT count(*) FROM public.missions WHERE scheduled_at::date = CURRENT_DATE);
END;
$$;
