-- Seed demo data pour Ma Conciergerie
-- Organisation ID: 890c5502-c4f0-4df9-8577-ce7aa46b1f40

DO $$
DECLARE
  v_org_id UUID := '890c5502-c4f0-4df9-8577-ce7aa46b1f40';
  v_admin_id UUID;

  v_proprio1_id UUID;
  v_proprio2_id UUID;
  v_proprio3_id UUID;

  v_log1_id UUID;
  v_log2_id UUID;
  v_log3_id UUID;
  v_log4_id UUID;
  v_log5_id UUID;

  v_prest1_id UUID;
BEGIN
  -- Nettoyer les données de démo existantes
  RAISE NOTICE 'Nettoyage des anciennes données...';
  DELETE FROM proprietaires WHERE organisation_id = v_org_id AND email LIKE '%@example.com';
  DELETE FROM prestataires WHERE organisation_id = v_org_id AND email LIKE '%@netclean.fr';
  DELETE FROM prestataires WHERE organisation_id = v_org_id AND email LIKE '%@plomberie-express.fr';
  DELETE FROM prestataires WHERE organisation_id = v_org_id AND email LIKE '%@elec-plus.fr';

  RAISE NOTICE '🏢 Création des données pour Ma Conciergerie...';

  -- Propriétaires
  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (v_org_id, 'Marie Dubois', 'marie.dubois@example.com', '+33 6 12 34 56 78')
  RETURNING id INTO v_proprio1_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (v_org_id, 'Jean Martin', 'jean.martin@example.com', '+33 6 23 45 67 89')
  RETURNING id INTO v_proprio2_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (v_org_id, 'Sophie Laurent', 'sophie.laurent@example.com', '+33 6 34 56 78 90')
  RETURNING id INTO v_proprio3_id;

  RAISE NOTICE '✅ 3 propriétaires créés';

  -- Logements
  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (v_org_id, v_proprio1_id, 'Studio Marais', '15 rue des Archives', 'Paris', '75003', 1, 2)
  RETURNING id INTO v_log1_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (v_org_id, v_proprio1_id, 'Appartement Tour Eiffel', '8 avenue de la Bourdonnais', 'Paris', '75007', 2, 4)
  RETURNING id INTO v_log2_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (v_org_id, v_proprio2_id, 'Loft Belleville', '42 rue de Belleville', 'Paris', '75020', 3, 6)
  RETURNING id INTO v_log3_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (v_org_id, v_proprio2_id, 'Duplex Montmartre', '25 rue Lepic', 'Paris', '75018', 2, 5)
  RETURNING id INTO v_log4_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (v_org_id, v_proprio3_id, 'Maison Saint-Germain', '12 rue de Grenelle', 'Paris', '75006', 4, 8)
  RETURNING id INTO v_log5_id;

  RAISE NOTICE '✅ 5 logements créés';

  -- Contrats (EXCLUSIF = contrat exclusif, SIMPLE = mandat simple)
  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (v_org_id, v_log1_id, v_proprio1_id, 'EXCLUSIF', 15.00, '2025-01-01', '2026-12-31', 'ACTIF');

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (v_org_id, v_log2_id, v_proprio1_id, 'EXCLUSIF', 18.00, '2025-01-01', '2026-12-31', 'ACTIF');

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (v_org_id, v_log3_id, v_proprio2_id, 'SIMPLE', 12.00, '2025-01-01', '2026-12-31', 'ACTIF');

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (v_org_id, v_log4_id, v_proprio2_id, 'EXCLUSIF', 20.00, '2025-01-01', '2026-12-31', 'ACTIF');

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (v_org_id, v_log5_id, v_proprio3_id, 'EXCLUSIF', 16.00, '2025-01-01', '2026-12-31', 'ACTIF');

  RAISE NOTICE '✅ 5 contrats créés (commissions 12-20%%)';

  -- Prestataires
  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone, reliability_score)
  VALUES (v_org_id, 'NetClean Pro', 'MENAGE', 'contact@netclean.fr', '+33 1 42 00 00 01', 5)
  RETURNING id INTO v_prest1_id;

  RAISE NOTICE '✅ 1 prestataire créé';

  -- Réservations Janvier-Février 2026
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES
    -- Studio Marais
    (v_org_id, v_log1_id, 'Alice Dupont', 'alice@example.com', '2026-01-05', '2026-01-10', 'AIRBNB', 450, 'CONFIRMEE'),
    (v_org_id, v_log1_id, 'Bob Smith', 'bob@example.com', '2026-01-12', '2026-01-15', 'BOOKING', 270, 'CONFIRMEE'),
    (v_org_id, v_log1_id, 'Clara Martin', 'clara@example.com', '2026-01-20', '2026-01-25', 'AIRBNB', 450, 'CONFIRMEE'),
    (v_org_id, v_log1_id, 'David Chen', 'david@example.com', '2026-02-01', '2026-02-07', 'DIRECT', 540, 'CONFIRMEE'),
    (v_org_id, v_log1_id, 'Emma Wilson', 'emma@example.com', '2026-02-10', '2026-02-14', 'BOOKING', 360, 'CONFIRMEE'),

    -- Appartement Tour Eiffel
    (v_org_id, v_log2_id, 'François Leroy', 'francois@example.com', '2026-01-03', '2026-01-08', 'AIRBNB', 750, 'CONFIRMEE'),
    (v_org_id, v_log2_id, 'Giulia Rossi', 'giulia@example.com', '2026-01-10', '2026-01-17', 'BOOKING', 1050, 'CONFIRMEE'),
    (v_org_id, v_log2_id, 'Hans Mueller', 'hans@example.com', '2026-01-19', '2026-01-24', 'DIRECT', 750, 'CONFIRMEE'),
    (v_org_id, v_log2_id, 'Isabelle Petit', 'isabelle@example.com', '2026-01-26', '2026-02-02', 'AIRBNB', 1050, 'CONFIRMEE'),
    (v_org_id, v_log2_id, 'James Brown', 'james@example.com', '2026-02-05', '2026-02-10', 'BOOKING', 750, 'CONFIRMEE'),

    -- Loft Belleville
    (v_org_id, v_log3_id, 'Laura Garcia', 'laura@example.com', '2026-01-06', '2026-01-13', 'AIRBNB', 1400, 'CONFIRMEE'),
    (v_org_id, v_log3_id, 'Marco Polo', 'marco@example.com', '2026-01-15', '2026-01-22', 'DIRECT', 1400, 'CONFIRMEE'),
    (v_org_id, v_log3_id, 'Nina Simone', 'nina@example.com', '2026-01-25', '2026-02-01', 'BOOKING', 1400, 'CONFIRMEE'),

    -- Duplex Montmartre
    (v_org_id, v_log4_id, 'Pierre Dubois', 'pierre@example.com', '2026-01-04', '2026-01-11', 'BOOKING', 1050, 'CONFIRMEE'),
    (v_org_id, v_log4_id, 'Quincy Jones', 'quincy@example.com', '2026-01-14', '2026-01-20', 'AIRBNB', 900, 'CONFIRMEE'),

    -- Maison Saint-Germain
    (v_org_id, v_log5_id, 'Thomas Anderson', 'thomas@example.com', '2026-01-07', '2026-01-14', 'AIRBNB', 2100, 'CONFIRMEE'),
    (v_org_id, v_log5_id, 'Uma Thurman', 'uma@example.com', '2026-01-18', '2026-01-25', 'DIRECT', 2100, 'CONFIRMEE');

  RAISE NOTICE '✅ 17 réservations créées';

  -- Missions de ménage
  INSERT INTO missions (organisation_id, logement_id, type, scheduled_at, status, notes)
  SELECT v_org_id, logement_id, 'MENAGE', check_out_date || ' 11:00:00', 'TERMINEE', 'Ménage après départ'
  FROM reservations
  WHERE organisation_id = v_org_id AND check_out_date < CURRENT_DATE
  LIMIT 8;

  RAISE NOTICE '✅ Missions créées';

  RAISE NOTICE '';
  RAISE NOTICE '🎉 Données de démo créées avec succès!';
  RAISE NOTICE '📊 Résumé:';
  RAISE NOTICE '   • 3 propriétaires';
  RAISE NOTICE '   • 5 logements à Paris';
  RAISE NOTICE '   • 5 contrats actifs (12-20%% commission)';
  RAISE NOTICE '   • 1 prestataire';
  RAISE NOTICE '   • 17 réservations (Janvier-Février 2026)';
  RAISE NOTICE '   • ~15,000€ CA brut';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Les revenus seront calculés automatiquement par les triggers!';
  RAISE NOTICE '   Recharge la page /finances pour voir les données.';
END $$;
