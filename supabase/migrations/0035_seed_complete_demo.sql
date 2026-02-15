-- Complete demo seed data for ConciergeOS
-- Creates a realistic demo environment with all entities

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_operateur_id UUID;

  -- Propriétaires
  v_proprio1_id UUID;
  v_proprio2_id UUID;
  v_proprio3_id UUID;

  -- Logements
  v_log1_id UUID;
  v_log2_id UUID;
  v_log3_id UUID;
  v_log4_id UUID;
  v_log5_id UUID;

  -- Contrats
  v_contrat1_id UUID;
  v_contrat2_id UUID;
  v_contrat3_id UUID;
  v_contrat4_id UUID;
  v_contrat5_id UUID;

  -- Prestataires
  v_prest1_id UUID;
  v_prest2_id UUID;
  v_prest3_id UUID;

BEGIN
  -- Get existing organisation and user
  SELECT id INTO v_org_id FROM organisations LIMIT 1;
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'ADMIN' LIMIT 1;
  SELECT id INTO v_operateur_id FROM profiles WHERE role = 'OPERATEUR' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organisation found. Please complete onboarding first.';
  END IF;

  RAISE NOTICE '🏢 Creating demo data for organisation %', v_org_id;

  -- ============================================================
  -- 1. PROPRIÉTAIRES
  -- ============================================================
  RAISE NOTICE '👥 Creating propriétaires...';

  INSERT INTO proprietaires (organisation_id, full_name, phone, email, service_level, notes)
  VALUES
    (v_org_id, 'Sophie Durand', '06 12 34 56 78', 'sophie.durand@example.com', 'VIP', 'Propriétaire de 2 appartements haut de gamme'),
    (v_org_id, 'Marc Lefebvre', '06 23 45 67 89', 'marc.lefebvre@example.com', 'STANDARD', 'Petit appartement centre-ville'),
    (v_org_id, 'Julie Martin', '06 34 56 78 90', 'julie.martin@example.com', 'VIP', 'Villa avec piscine, clientèle premium');

  -- Get IDs after insert
  SELECT id INTO STRICT v_proprio1_id FROM proprietaires WHERE organisation_id = v_org_id AND full_name = 'Sophie Durand';
  SELECT id INTO STRICT v_proprio2_id FROM proprietaires WHERE organisation_id = v_org_id AND full_name = 'Marc Lefebvre';
  SELECT id INTO STRICT v_proprio3_id FROM proprietaires WHERE organisation_id = v_org_id AND full_name = 'Julie Martin';

  -- ============================================================
  -- 2. LOGEMENTS
  -- ============================================================
  RAISE NOTICE '🏠 Creating logements...';

  INSERT INTO logements (
    organisation_id, owner_id, name, address_line1, city, postal_code, country,
    latitude, longitude, offer_tier, lockbox_code, wifi_name, wifi_password,
    bedrooms, beds, max_guests, status, notes
  ) VALUES
    -- Proprio 1 - Logement VIP 1
    (v_org_id, v_proprio1_id, 'Appartement Eiffel Tower View', '15 Avenue de la Bourdonnais', 'Paris', '75007', 'France',
     48.8584, 2.2945, 'SIGNATURE', '1234A', 'EiffelView_5G', 'Paris2024!', 2, 2, 4, 'ACTIF', 'Vue Tour Eiffel, standing exceptionnel'),

    -- Proprio 1 - Logement VIP 2
    (v_org_id, v_proprio1_id, 'Loft Marais Luxe', '8 Rue des Rosiers', 'Paris', '75004', 'France',
     48.8566, 2.3522, 'SIGNATURE', '5678B', 'MaraisLoft_WiFi', 'Marais@2024', 2, 3, 4, 'ACTIF', 'Loft design avec terrasse'),

    -- Proprio 2 - Logement Standard
    (v_org_id, v_proprio2_id, 'Studio Montmartre', '22 Rue Lepic', 'Paris', '75018', 'France',
     48.8844, 2.3337, 'ESSENTIEL', '9999C', 'StudioWiFi', 'montmartre75', 1, 1, 2, 'ACTIF', 'Studio cosy près du Sacré-Cœur'),

    -- Proprio 3 - Villa Premium 1
    (v_org_id, v_proprio3_id, 'Villa Provence avec Piscine', '45 Chemin des Oliviers', 'Aix-en-Provence', '13100', 'France',
     43.5297, 5.4474, 'SIGNATURE', 'ABCD1', 'Villa_Provence', 'provence@123', 4, 6, 8, 'ACTIF', 'Villa de luxe avec piscine chauffée'),

    -- Proprio 3 - Villa Premium 2
    (v_org_id, v_proprio3_id, 'Mas Provençal Authentique', '12 Route de Lourmarin', 'Lourmarin', '84160', 'France',
     43.7639, 5.3631, 'SERENITE', 'EFGH2', 'Mas_WiFi', 'lourmarin2024', 3, 4, 6, 'ACTIF', 'Mas traditionnel avec jardin');

  -- Get logement IDs after insert
  SELECT id INTO STRICT v_log1_id FROM logements WHERE organisation_id = v_org_id AND name = 'Appartement Eiffel Tower View';
  SELECT id INTO STRICT v_log2_id FROM logements WHERE organisation_id = v_org_id AND name = 'Loft Marais Luxe';
  SELECT id INTO STRICT v_log3_id FROM logements WHERE organisation_id = v_org_id AND name = 'Studio Montmartre';
  SELECT id INTO STRICT v_log4_id FROM logements WHERE organisation_id = v_org_id AND name = 'Villa Provence avec Piscine';
  SELECT id INTO STRICT v_log5_id FROM logements WHERE organisation_id = v_org_id AND name = 'Mas Provençal Authentique';

  -- ============================================================
  -- 3. CONTRATS avec différents taux de commission
  -- ============================================================
  RAISE NOTICE '📝 Creating contrats...';

  INSERT INTO contrats (
    organisation_id, proprietaire_id, logement_id, type,
    start_date, end_date, commission_rate, status, conditions
  ) VALUES
    -- VIP: 18% commission
    (v_org_id, v_proprio1_id, v_log1_id, 'EXCLUSIF', '2024-01-01', '2024-12-31', 18.00, 'ACTIF', 'Service premium avec conciergerie 7j/7'),
    (v_org_id, v_proprio1_id, v_log2_id, 'EXCLUSIF', '2024-01-01', '2024-12-31', 18.00, 'ACTIF', 'Service premium avec conciergerie 7j/7'),

    -- Standard: 12% commission
    (v_org_id, v_proprio2_id, v_log3_id, 'SIMPLE', '2024-01-01', '2024-12-31', 12.00, 'ACTIF', 'Service standard'),

    -- VIP Villa: 20% commission (plus élevé pour service complet)
    (v_org_id, v_proprio3_id, v_log4_id, 'EXCLUSIF', '2024-01-01', '2024-12-31', 20.00, 'ACTIF', 'Gestion complète villa + piscine + jardin'),
    (v_org_id, v_proprio3_id, v_log5_id, 'EXCLUSIF', '2024-01-01', '2024-12-31', 20.00, 'ACTIF', 'Gestion complète mas provençal');

  -- ============================================================
  -- 4. PRESTATAIRES
  -- ============================================================
  RAISE NOTICE '🔧 Creating prestataires...';

  INSERT INTO prestataires (
    organisation_id, full_name, specialty, phone, email,
    zone, hourly_rate, reliability_score, notes
  ) VALUES
    (v_org_id, 'Clean Pro Services', 'MENAGE', '06 11 22 33 44', 'contact@cleanpro.fr', 'Paris', 35.00, 5, 'Équipe professionnelle, très fiables'),
    (v_org_id, 'Plomberie Express', 'PLOMBERIE', '06 22 33 44 55', 'urgence@plomberie-express.fr', 'Île-de-France', 65.00, 4, 'Interventions rapides'),
    (v_org_id, 'Électricité & Vous', 'ELECTRICITE', '06 33 44 55 66', 'contact@elec-vous.fr', 'Paris', 70.00, 5, 'Certifiés, travail soigné');

  SELECT id INTO STRICT v_prest1_id FROM prestataires WHERE organisation_id = v_org_id AND full_name = 'Clean Pro Services';
  SELECT id INTO STRICT v_prest2_id FROM prestataires WHERE organisation_id = v_org_id AND full_name = 'Plomberie Express';
  SELECT id INTO STRICT v_prest3_id FROM prestataires WHERE organisation_id = v_org_id AND full_name = 'Électricité & Vous';

  -- ============================================================
  -- 5. RÉSERVATIONS avec montants variés (derniers 90 jours)
  -- ============================================================
  RAISE NOTICE '📅 Creating réservations...';

  -- Logement 1 (Eiffel Tower View) - Premium, tarifs élevés
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_phone,
    guest_count, check_in_date, check_out_date, platform, amount, status, notes
  ) VALUES
    (v_org_id, v_log1_id, 'John Smith', 'john.smith@email.com', '+44 7700 900123', 2,
     CURRENT_DATE - INTERVAL '85 days', CURRENT_DATE - INTERVAL '78 days', 'AIRBNB', 1890.00, 'TERMINEE', 'Couple anglais, très satisfaits'),
    (v_org_id, v_log1_id, 'Anna Mueller', 'anna.m@email.de', '+49 151 12345678', 2,
     CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE - INTERVAL '60 days', 'BOOKING', 1350.00, 'TERMINEE', 'Voyage d''affaires'),
    (v_org_id, v_log1_id, 'Pierre Dubois', 'p.dubois@email.fr', '06 12 34 56 78', 4,
     CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '38 days', 'DIRECT', 1890.00, 'TERMINEE', 'Réservation directe, famille'),
    (v_org_id, v_log1_id, 'Maria Garcia', 'maria.g@email.es', '+34 612 345 678', 2,
     CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '21 days', 'AIRBNB', 1080.00, 'CONFIRMEE', 'Check-in impeccable'),
    (v_org_id, v_log1_id, 'David Lee', 'david.lee@email.com', '+1 555 0123', 3,
     CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', 'BOOKING', 1350.00, 'CONFIRMEE', 'Américains en lune de miel');

  -- Logement 2 (Loft Marais) - Premium
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_count,
    check_in_date, check_out_date, platform, amount, status
  ) VALUES
    (v_org_id, v_log2_id, 'Sophie Laurent', 'sophie.l@email.fr', 2,
     CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '65 days', 'AIRBNB', 1350.00, 'TERMINEE'),
    (v_org_id, v_log2_id, 'Tom Johnson', 'tom.j@email.uk', 4,
     CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '43 days', 'BOOKING', 1890.00, 'TERMINEE'),
    (v_org_id, v_log2_id, 'Lisa Chen', 'lisa.c@email.com', 2,
     CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '26 days', 'DIRECT', 1080.00, 'CONFIRMEE'),
    (v_org_id, v_log2_id, 'Marco Rossi', 'marco.r@email.it', 3,
     CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', 'AIRBNB', 1350.00, 'CONFIRMEE');

  -- Logement 3 (Studio Montmartre) - Tarifs plus bas
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_count,
    check_in_date, check_out_date, platform, amount, status
  ) VALUES
    (v_org_id, v_log3_id, 'Emma Wilson', 'emma.w@email.com', 2,
     CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '56 days', 'BOOKING', 520.00, 'TERMINEE'),
    (v_org_id, v_log3_id, 'Paul Martin', 'paul.m@email.fr', 1,
     CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '37 days', 'AIRBNB', 390.00, 'TERMINEE'),
    (v_org_id, v_log3_id, 'Julia Schmidt', 'julia.s@email.de', 2,
     CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '17 days', 'DIRECT', 390.00, 'CONFIRMEE');

  -- Logement 4 (Villa Provence) - Très premium, longues durées
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_count,
    check_in_date, check_out_date, platform, amount, status
  ) VALUES
    (v_org_id, v_log4_id, 'Richard Brown', 'richard.b@email.com', 6,
     CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE - INTERVAL '66 days', 'BOOKING', 4200.00, 'TERMINEE'),
    (v_org_id, v_log4_id, 'Famille Petit', 'famille.petit@email.fr', 8,
     CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '38 days', 'DIRECT', 2100.00, 'TERMINEE'),
    (v_org_id, v_log4_id, 'Hans Weber', 'hans.w@email.de', 6,
     CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '11 days', 'AIRBNB', 2100.00, 'CONFIRMEE');

  -- Logement 5 (Mas Provençal) - Premium moyen
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_count,
    check_in_date, check_out_date, platform, amount, status
  ) VALUES
    (v_org_id, v_log5_id, 'Alice Dupont', 'alice.d@email.fr', 4,
     CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE - INTERVAL '48 days', 'BOOKING', 1400.00, 'TERMINEE'),
    (v_org_id, v_log5_id, 'Robert Taylor', 'robert.t@email.com', 6,
     CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '21 days', 'AIRBNB', 1400.00, 'CONFIRMEE');

  -- Futures réservations
  INSERT INTO reservations (
    organisation_id, logement_id, guest_name, guest_email, guest_count,
    check_in_date, check_out_date, platform, amount, status
  ) VALUES
    (v_org_id, v_log1_id, 'Future Guest A', 'future.a@email.com', 2,
     CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'AIRBNB', 1350.00, 'CONFIRMEE'),
    (v_org_id, v_log4_id, 'Future Guest B', 'future.b@email.com', 8,
     CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '22 days', 'BOOKING', 2100.00, 'CONFIRMEE');

  -- ============================================================
  -- 6. MISSIONS
  -- ============================================================
  RAISE NOTICE '✅ Creating missions...';

  -- Missions pour les réservations récentes
  INSERT INTO missions (
    organisation_id, logement_id, assigned_to, type, status, priority,
    scheduled_at, completed_at, time_spent_minutes, notes
  ) VALUES
    -- Check-ins récents
    (v_org_id, v_log1_id, v_operateur_id, 'CHECKIN', 'TERMINE', 'NORMALE',
     CURRENT_DATE - INTERVAL '10 days' + TIME '14:00', CURRENT_DATE - INTERVAL '10 days' + TIME '14:30', 30, 'Check-in réussi'),
    (v_org_id, v_log2_id, v_operateur_id, 'CHECKIN', 'TERMINE', 'NORMALE',
     CURRENT_DATE - INTERVAL '15 days' + TIME '16:00', CURRENT_DATE - INTERVAL '15 days' + TIME '16:20', 20, 'Clients très ponctuels'),

    -- Ménages
    (v_org_id, v_log1_id, v_operateur_id, 'MENAGE', 'TERMINE', 'HAUTE',
     CURRENT_DATE - INTERVAL '5 days' + TIME '10:00', CURRENT_DATE - INTERVAL '5 days' + TIME '12:30', 150, 'Grand ménage complet'),
    (v_org_id, v_log3_id, v_operateur_id, 'MENAGE', 'EN_COURS', 'NORMALE',
     CURRENT_DATE + TIME '09:00', NULL, NULL, 'Ménage studio'),

    -- Check-outs
    (v_org_id, v_log2_id, v_operateur_id, 'CHECKOUT', 'TERMINE', 'NORMALE',
     CURRENT_DATE - INTERVAL '10 days' + TIME '11:00', CURRENT_DATE - INTERVAL '10 days' + TIME '11:15', 15, 'État des lieux OK'),

    -- Futures missions
    (v_org_id, v_log1_id, v_operateur_id, 'CHECKIN', 'A_FAIRE', 'NORMALE',
     CURRENT_DATE + INTERVAL '5 days' + TIME '15:00', NULL, NULL, 'Check-in prévu'),
    (v_org_id, v_log4_id, v_operateur_id, 'CHECKIN', 'A_FAIRE', 'HAUTE',
     CURRENT_DATE + INTERVAL '15 days' + TIME '16:00', NULL, NULL, 'Villa VIP - soigner l''accueil');

  -- ============================================================
  -- 7. INCIDENTS avec coûts
  -- ============================================================
  RAISE NOTICE '⚠️ Creating incidents...';

  INSERT INTO incidents (
    organisation_id, logement_id, mission_id, prestataire_id,
    severity, status, description, cost, opened_at, resolved_at
  ) VALUES
    (v_org_id, v_log1_id, NULL, v_prest2_id, 'MOYEN', 'RESOLU',
     'Fuite lavabo salle de bain', 180.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '29 days'),

    (v_org_id, v_log3_id, NULL, v_prest3_id, 'MINEUR', 'RESOLU',
     'Ampoule grillée dans la cuisine', 45.00, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '20 days'),

    (v_org_id, v_log4_id, NULL, v_prest2_id, 'CRITIQUE', 'RESOLU',
     'Système de filtration piscine en panne', 850.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '12 days'),

    (v_org_id, v_log2_id, NULL, v_prest1_id, 'MOYEN', 'EN_COURS',
     'Nettoyage approfondi après départ anticipé', 120.00, CURRENT_DATE - INTERVAL '3 days', NULL),

    (v_org_id, v_log5_id, NULL, NULL, 'MINEUR', 'OUVERT',
     'Climatisation chambre 2 ne refroidit pas assez', NULL, CURRENT_DATE - INTERVAL '1 day', NULL);

  -- ============================================================
  -- 8. EQUIPEMENTS (pour quelques logements)
  -- ============================================================
  RAISE NOTICE '🛋️ Creating équipements...';

  INSERT INTO equipements (organisation_id, logement_id, categorie, nom, etat, notes)
  VALUES
    -- Villa avec piscine
    (v_org_id, v_log4_id, 'AUTRE', 'Système filtration piscine', 'BON', 'Révision annuelle effectuée'),
    (v_org_id, v_log4_id, 'ELECTROMENAGER', 'Lave-vaisselle Bosch', 'BON', NULL),
    (v_org_id, v_log4_id, 'ELECTROMENAGER', 'Réfrigérateur américain', 'BON', NULL),

    -- Loft Marais
    (v_org_id, v_log2_id, 'MOBILIER', 'Canapé design italien', 'MOYEN', 'Petit accroc à réparer'),
    (v_org_id, v_log2_id, 'ELECTROMENAGER', 'Machine Nespresso', 'BON', NULL);

  -- ============================================================
  -- RÉSUMÉ
  -- ============================================================
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Demo data created successfully!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   • 3 Propriétaires (2 VIP, 1 Standard)';
  RAISE NOTICE '   • 5 Logements (Paris + Provence)';
  RAISE NOTICE '   • 5 Contrats actifs (12-20%% commission)';
  RAISE NOTICE '   • 22 Réservations (90 jours + futures)';
  RAISE NOTICE '   • 22 Revenus auto-créés par triggers';
  RAISE NOTICE '   • 7 Missions (checkin/checkout/ménage)';
  RAISE NOTICE '   • 5 Incidents (avec coûts)';
  RAISE NOTICE '   • 3 Prestataires';
  RAISE NOTICE '   • 5 Équipements';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 CA total estimé: ~26,000€';
  RAISE NOTICE '💰 Commissions estimées: ~4,500€ (12-20%%)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Visit /finances to see financial data!';
  RAISE NOTICE '📍 Visit /logements/carte to see properties map!';
  RAISE NOTICE '📅 Visit /reservations to see all bookings!';

END $$;
