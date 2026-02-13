-- ============================================================
-- ConciergeOS — Données de démonstration
-- Conciergerie Côte d'Azur (Nice, Cannes, Antibes, Monaco)
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
  v_admin_id uuid;
  -- Propriétaires
  v_prop_dupont uuid;
  v_prop_martin uuid;
  v_prop_bernard uuid;
  v_prop_leroy uuid;
  v_prop_moreau uuid;
  -- Logements
  v_log_promenade uuid;
  v_log_vieux_nice uuid;
  v_log_croisette uuid;
  v_log_antibes uuid;
  v_log_monaco uuid;
  v_log_villefranche uuid;
  v_log_cannes_centre uuid;
  v_log_nice_port uuid;
  -- Prestataires
  v_prest_cleaning uuid;
  v_prest_plombier uuid;
  v_prest_elec uuid;
  v_prest_clim uuid;
  v_prest_multi uuid;
  v_prest_menage2 uuid;
  -- Missions
  v_mission1 uuid;
  v_mission2 uuid;
  v_mission3 uuid;
BEGIN
  -- Récupérer l'org et l'admin existants
  SELECT id INTO v_org_id FROM public.organisations LIMIT 1;
  SELECT id INTO v_admin_id FROM public.profiles WHERE organisation_id = v_org_id LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvée. Connectez-vous d''abord pour créer votre compte.';
  END IF;

  -- ============================================================
  -- PROPRIÉTAIRES (5)
  -- ============================================================
  INSERT INTO public.proprietaires (id, organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Jean-Pierre Dupont', '+33 6 12 34 56 78', 'jp.dupont@gmail.com', 'VIP', 'Propriétaire historique, 3 biens en gestion. Très réactif par téléphone.')
  RETURNING id INTO v_prop_dupont;

  INSERT INTO public.proprietaires (id, organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Sophie Martin', '+33 6 98 76 54 32', 'sophie.martin@outlook.fr', 'VIP', 'Expatriée à Londres. Communication par email uniquement.')
  RETURNING id INTO v_prop_martin;

  INSERT INTO public.proprietaires (id, organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Marc Bernard', '+33 6 55 44 33 22', 'marc.bernard@free.fr', 'STANDARD', 'Premier bien en location saisonnière. Demande beaucoup de photos.')
  RETURNING id INTO v_prop_bernard;

  INSERT INTO public.proprietaires (id, organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Catherine Leroy', '+33 6 77 88 99 00', 'c.leroy@wanadoo.fr', 'STANDARD', 'Propriétaire à Paris. Visite ses biens 2 fois par an.')
  RETURNING id INTO v_prop_leroy;

  INSERT INTO public.proprietaires (id, organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Philippe Moreau', '+33 7 11 22 33 44', 'p.moreau@gmail.com', 'VIP', 'Investisseur immobilier, très exigeant sur la qualité des prestations.')
  RETURNING id INTO v_prop_moreau;

  -- ============================================================
  -- LOGEMENTS (8)
  -- ============================================================
  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_dupont, 'Villa Promenade', '12 Promenade des Anglais', 'Nice', '06000', 'SIGNATURE', '4582', 'Villa_Promenade_5G', 'SunnyNice2024!', 'T4 vue mer, terrasse 40m², parking privatif. Très demandé en haute saison.', 'ACTIF')
  RETURNING id INTO v_log_promenade;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_dupont, 'Studio Vieux-Nice', '8 Rue du Pont Vieux', 'Nice', '06300', 'ESSENTIEL', '1234', 'VieuxNice_Wifi', 'Bonjour06!', 'Studio 25m² au cœur du Vieux-Nice. Idéal couples. 2ème étage sans ascenseur.', 'ACTIF')
  RETURNING id INTO v_log_vieux_nice;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_martin, 'Appt La Croisette', '45 Boulevard de la Croisette', 'Cannes', '06400', 'SIGNATURE', '7890', 'Croisette_Premium', 'Cannes2024!', 'T3 luxe face au Palais des Festivals. Balcon vue mer. Concierge immeuble 24/7.', 'ACTIF')
  RETURNING id INTO v_log_croisette;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_bernard, 'Maison Cap d''Antibes', '3 Chemin des Sables', 'Antibes', '06160', 'SERENITE', '5566', 'CapAntibes_Net', 'Plage2024', 'Maison 90m² avec jardin, 5 min à pied de la plage. Piscine partagée.', 'ACTIF')
  RETURNING id INTO v_log_antibes;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_moreau, 'Penthouse Monaco', '15 Avenue Princesse Grace', 'Monaco', '98000', 'SIGNATURE', '9999', 'Monaco_Luxe', 'Monte#Carlo1', 'Penthouse 120m², terrasse panoramique, 2 places parking. Clientèle ultra-premium.', 'ACTIF')
  RETURNING id INTO v_log_monaco;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_dupont, 'T2 Villefranche-sur-Mer', '22 Rue Obscure', 'Villefranche-sur-Mer', '06230', 'SERENITE', '3344', 'Villefranche_Home', 'Harbor2024', 'T2 charmant avec vue sur la rade. Ruelle piétonne, accès valise difficile.', 'ACTIF')
  RETURNING id INTO v_log_villefranche;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_leroy, 'Loft Cannes Centre', '10 Rue d''Antibes', 'Cannes', '06400', 'SERENITE', '2468', 'Loft_Cannes', 'Shopping06!', 'Loft 55m² design industriel. Rue commerçante. Proche gare.', 'ACTIF')
  RETURNING id INTO v_log_cannes_centre;

  INSERT INTO public.logements (id, organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, lockbox_code, wifi_name, wifi_password, notes, status)
  VALUES
    (gen_random_uuid(), v_org_id, v_prop_moreau, 'Appt Nice Port', '5 Place Île de Beauté', 'Nice', '06300', 'ESSENTIEL', '1357', 'NicePort_Wifi', 'Bateaux06', 'T2 rénové face au port. Marché aux puces le samedi. Animé le soir.', 'PAUSE')
  RETURNING id INTO v_log_nice_port;

  -- ============================================================
  -- PRESTATAIRES (6)
  -- ============================================================
  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Azur Clean Services', 'MENAGE', '+33 6 20 30 40 50', 'contact@azurclean.fr', 'Nice, Villefranche', 35, 5, 'Équipe de 4 personnes. Très fiable, jamais de retard. Kit linge fourni.')
  RETURNING id INTO v_prest_cleaning;

  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Roberto Plomberie', 'PLOMBERIE', '+33 6 60 70 80 90', 'roberto.plomberie@gmail.com', 'Nice, Cannes, Antibes', 55, 4, 'Intervient sous 2h en urgence. Devis gratuit. Très compétent.')
  RETURNING id INTO v_prest_plombier;

  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Élec Azur', 'ELECTRICITE', '+33 6 11 22 33 44', 'elec.azur@outlook.fr', 'Nice, Monaco', 50, 4, 'Certifié. Spécialiste domotique et tableau électrique.')
  RETURNING id INTO v_prest_elec;

  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Clima Riviera', 'CLIM', '+33 4 93 00 11 22', 'info@climariviera.fr', 'Toute la Côte d''Azur', 60, 3, 'Entretien et dépannage clim. Délai parfois long en été (forte demande).')
  RETURNING id INTO v_prest_clim;

  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Riviera Multi-Services', 'AUTRE', '+33 7 55 66 77 88', 'riviera.ms@gmail.com', 'Cannes, Antibes', 40, 5, 'Homme à tout faire. Montage meubles, petits travaux, peinture. Très polyvalent.')
  RETURNING id INTO v_prest_multi;

  INSERT INTO public.prestataires (id, organisation_id, full_name, specialty, phone, email, zone, hourly_rate, reliability_score, notes)
  VALUES
    (gen_random_uuid(), v_org_id, 'Maria Nettoyage', 'MENAGE', '+33 6 44 55 66 77', 'maria.nettoyage@gmail.com', 'Cannes, Monaco', 30, 4, 'Travailleuse indépendante. Excellente pour les grands logements. Flexible sur les horaires.')
  RETURNING id INTO v_prest_menage2;

  -- ============================================================
  -- MISSIONS (~20 missions réparties sur les derniers jours et à venir)
  -- ============================================================

  -- Missions d'aujourd'hui
  INSERT INTO public.missions (organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, notes)
  VALUES
    (v_org_id, v_log_promenade, v_admin_id, 'CHECKOUT', 'A_FAIRE', 'NORMALE', NOW()::date + interval '10 hours', 'Départ famille Müller. Vérifier état terrasse.'),
    (v_org_id, v_log_croisette, v_admin_id, 'CHECKIN', 'A_FAIRE', 'HAUTE', NOW()::date + interval '15 hours', 'Arrivée M. et Mme Tanaka. Vol depuis Tokyo, arrivée 14h30. Welcome pack VIP.'),
    (v_org_id, v_log_antibes, v_admin_id, 'MENAGE', 'EN_COURS', 'NORMALE', NOW()::date + interval '9 hours', 'Ménage complet après séjour longue durée (3 semaines). Linge à changer.'),
    (v_org_id, v_log_villefranche, v_admin_id, 'CHECKIN', 'A_FAIRE', 'NORMALE', NOW()::date + interval '16 hours', 'Couple anglais. Premier séjour. Leur envoyer les instructions de parking.');

  -- Missions terminées (jours précédents)
  INSERT INTO public.missions (id, organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, completed_at, time_spent_minutes, notes)
  VALUES
    (gen_random_uuid(), v_org_id, v_log_promenade, v_admin_id, 'CHECKIN', 'TERMINE', 'NORMALE', NOW()::date - interval '5 days' + interval '14 hours', NOW()::date - interval '5 days' + interval '14 hours 30 minutes', 30, 'Check-in famille Müller OK. Tout en ordre.')
  RETURNING id INTO v_mission1;

  INSERT INTO public.missions (id, organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, completed_at, time_spent_minutes, notes)
  VALUES
    (gen_random_uuid(), v_org_id, v_log_croisette, v_admin_id, 'CHECKOUT', 'TERMINE', 'NORMALE', NOW()::date - interval '2 days' + interval '11 hours', NOW()::date - interval '2 days' + interval '11 hours 45 minutes', 45, 'Checkout M. Rivera. Appartement en bon état, légère trace sur le canapé.')
  RETURNING id INTO v_mission2;

  INSERT INTO public.missions (id, organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, completed_at, time_spent_minutes, notes)
  VALUES
    (gen_random_uuid(), v_org_id, v_log_vieux_nice, v_admin_id, 'MENAGE', 'TERMINE', 'NORMALE', NOW()::date - interval '1 day' + interval '10 hours', NOW()::date - interval '1 day' + interval '12 hours', 120, 'Ménage complet studio. Remplacement draps et serviettes.')
  RETURNING id INTO v_mission3;

  INSERT INTO public.missions (organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, completed_at, time_spent_minutes, notes)
  VALUES
    (v_org_id, v_log_monaco, v_admin_id, 'CHECKIN', 'TERMINE', 'HAUTE', NOW()::date - interval '3 days' + interval '18 hours', NOW()::date - interval '3 days' + interval '18 hours 20 minutes', 20, 'Check-in client VIP. Champagne et fleurs déposés.'),
    (v_org_id, v_log_cannes_centre, v_admin_id, 'MENAGE', 'TERMINE', 'NORMALE', NOW()::date - interval '4 days' + interval '9 hours', NOW()::date - interval '4 days' + interval '11 hours', 90, 'Ménage standard loft.'),
    (v_org_id, v_log_antibes, v_admin_id, 'CHECKOUT', 'TERMINE', 'NORMALE', NOW()::date - interval '1 day' + interval '10 hours', NOW()::date - interval '1 day' + interval '10 hours 30 minutes', 30, 'Checkout locataire longue durée. RAS.'),
    (v_org_id, v_log_villefranche, v_admin_id, 'INTERVENTION', 'TERMINE', 'HAUTE', NOW()::date - interval '7 days' + interval '14 hours', NOW()::date - interval '7 days' + interval '16 hours', 120, 'Remplacement joint silicone douche. Prestataire Roberto.');

  -- Missions à venir
  INSERT INTO public.missions (organisation_id, logement_id, assigned_to, type, status, priority, scheduled_at, notes)
  VALUES
    (v_org_id, v_log_promenade, v_admin_id, 'CHECKIN', 'A_FAIRE', 'HAUTE', NOW()::date + interval '1 day' + interval '15 hours', 'Arrivée nouvelle réservation. Préparer welcome pack Signature.'),
    (v_org_id, v_log_monaco, v_admin_id, 'CHECKOUT', 'A_FAIRE', 'NORMALE', NOW()::date + interval '2 days' + interval '11 hours', 'Départ client VIP. Vérification complète du penthouse.'),
    (v_org_id, v_log_vieux_nice, v_admin_id, 'CHECKIN', 'A_FAIRE', 'NORMALE', NOW()::date + interval '2 days' + interval '16 hours', 'Arrivée couple français. Séjour 4 nuits.'),
    (v_org_id, v_log_cannes_centre, v_admin_id, 'URGENCE', 'A_FAIRE', 'CRITIQUE', NOW()::date + interval '1 day' + interval '8 hours', 'Signalement voisin: fuite d''eau probable. À vérifier en urgence.'),
    (v_org_id, v_log_croisette, v_admin_id, 'MENAGE', 'A_FAIRE', 'NORMALE', NOW()::date + interval '1 day' + interval '10 hours', 'Ménage avant arrivée Tanaka. Prestation Signature complète.'),
    (v_org_id, v_log_nice_port, v_admin_id, 'INTERVENTION', 'A_FAIRE', 'HAUTE', NOW()::date + interval '3 days' + interval '9 hours', 'Révision chaudière annuelle. Prestataire à contacter.');

  -- ============================================================
  -- INCIDENTS (8)
  -- ============================================================

  -- Incidents ouverts / en cours
  INSERT INTO public.incidents (organisation_id, logement_id, mission_id, prestataire_id, severity, status, description, cost, opened_at)
  VALUES
    (v_org_id, v_log_cannes_centre, NULL, v_prest_plombier, 'CRITIQUE', 'OUVERT', 'Fuite d''eau sous l''évier de la cuisine. Voisin du dessous signale des traces au plafond. Intervention urgente nécessaire.', NULL, NOW() - interval '6 hours'),
    (v_org_id, v_log_monaco, NULL, v_prest_clim, 'MOYEN', 'EN_COURS', 'Climatisation fait un bruit anormal dans la chambre principale. Le client se plaint de nuisances sonores la nuit.', NULL, NOW() - interval '2 days'),
    (v_org_id, v_log_promenade, NULL, NULL, 'MINEUR', 'OUVERT', 'Ampoule grillée dans le couloir d''entrée. À remplacer lors du prochain passage.', NULL, NOW() - interval '1 day'),
    (v_org_id, v_log_antibes, NULL, NULL, 'MOYEN', 'OUVERT', 'Porte-fenêtre du salon ne ferme plus correctement. Problème de gond. Sécurité compromise.', NULL, NOW() - interval '3 days');

  -- Incidents résolus
  INSERT INTO public.incidents (organisation_id, logement_id, mission_id, prestataire_id, severity, status, description, cost, opened_at, resolved_at)
  VALUES
    (v_org_id, v_log_vieux_nice, v_mission3, v_prest_cleaning, 'MINEUR', 'RESOLU', 'Tache de vin sur le tapis du salon. Nettoyage professionnel effectué.', 85, NOW() - interval '10 days', NOW() - interval '8 days'),
    (v_org_id, v_log_croisette, v_mission2, v_prest_multi, 'MOYEN', 'RESOLU', 'Store électrique de la terrasse bloqué en position basse. Moteur remplacé.', 320, NOW() - interval '15 days', NOW() - interval '12 days'),
    (v_org_id, v_log_villefranche, NULL, v_prest_plombier, 'CRITIQUE', 'CLOS', 'Fuite importante au niveau du ballon d''eau chaude. Remplacement complet du cumulus.', 890, NOW() - interval '25 days', NOW() - interval '20 days'),
    (v_org_id, v_log_promenade, NULL, v_prest_elec, 'MOYEN', 'RESOLU', 'Disjoncteur saute régulièrement quand le four et la climatisation fonctionnent simultanément. Tableau électrique mis aux normes.', 450, NOW() - interval '18 days', NOW() - interval '14 days');

  RAISE NOTICE 'Seed terminé ! Données insérées: 5 propriétaires, 8 logements, 6 prestataires, ~20 missions, 8 incidents.';
END;
$$;
