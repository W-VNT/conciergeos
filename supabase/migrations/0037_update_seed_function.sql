-- Migration: Function to seed demo data for a specific organisation
-- Usage: SELECT seed_demo_data_for_org('your-org-id-here');

CREATE OR REPLACE FUNCTION seed_demo_data_for_org(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
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
  RAISE NOTICE '🧹 Cleaning existing demo data for org %...', p_org_id;

  -- Delete existing demo data (cascades will handle related records)
  DELETE FROM proprietaires WHERE organisation_id = p_org_id;
  DELETE FROM prestataires WHERE organisation_id = p_org_id;
  DELETE FROM logements WHERE organisation_id = p_org_id;

  RAISE NOTICE '🏢 Creating demo data for organisation %', p_org_id;

  -- Get users from this org
  SELECT id INTO v_admin_id FROM profiles WHERE organisation_id = p_org_id AND role = 'ADMIN' LIMIT 1;
  SELECT id INTO v_operateur_id FROM profiles WHERE organisation_id = p_org_id AND role = 'OPERATEUR' LIMIT 1;

  -- ============================================================
  -- 1. PROPRIÉTAIRES
  -- ============================================================
  RAISE NOTICE '👥 Creating propriétaires...';

  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (p_org_id, 'Marie Dubois', 'marie.dubois@example.com', '+33 6 12 34 56 78');
  SELECT id INTO STRICT v_proprio1_id FROM proprietaires WHERE email = 'marie.dubois@example.com' AND organisation_id = p_org_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (p_org_id, 'Jean Martin', 'jean.martin@example.com', '+33 6 23 45 67 89');
  SELECT id INTO STRICT v_proprio2_id FROM proprietaires WHERE email = 'jean.martin@example.com' AND organisation_id = p_org_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone)
  VALUES (p_org_id, 'Sophie Laurent', 'sophie.laurent@example.com', '+33 6 34 56 78 90');
  SELECT id INTO STRICT v_proprio3_id FROM proprietaires WHERE email = 'sophie.laurent@example.com' AND organisation_id = p_org_id;

  -- ============================================================
  -- 2. LOGEMENTS
  -- ============================================================
  RAISE NOTICE '🏠 Creating logements...';

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (p_org_id, v_proprio1_id, 'Studio Marais', '15 rue des Archives', 'Paris', '75003', 1, 2);
  SELECT id INTO STRICT v_log1_id FROM logements WHERE name = 'Studio Marais' AND organisation_id = p_org_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (p_org_id, v_proprio1_id, 'Appartement Tour Eiffel', '8 avenue de la Bourdonnais', 'Paris', '75007', 2, 4);
  SELECT id INTO STRICT v_log2_id FROM logements WHERE name = 'Appartement Tour Eiffel' AND organisation_id = p_org_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (p_org_id, v_proprio2_id, 'Loft Belleville', '42 rue de Belleville', 'Paris', '75020', 3, 6);
  SELECT id INTO STRICT v_log3_id FROM logements WHERE name = 'Loft Belleville' AND organisation_id = p_org_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (p_org_id, v_proprio2_id, 'Duplex Montmartre', '25 rue Lepic', 'Paris', '75018', 2, 5);
  SELECT id INTO STRICT v_log4_id FROM logements WHERE name = 'Duplex Montmartre' AND organisation_id = p_org_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, bedrooms, max_guests)
  VALUES (p_org_id, v_proprio3_id, 'Maison Saint-Germain', '12 rue de Grenelle', 'Paris', '75006', 4, 8);
  SELECT id INTO STRICT v_log5_id FROM logements WHERE name = 'Maison Saint-Germain' AND organisation_id = p_org_id;

  -- ============================================================
  -- 3. CONTRATS
  -- ============================================================
  RAISE NOTICE '📄 Creating contrats...';

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (p_org_id, v_log1_id, v_proprio1_id, 'GESTION_COMPLETE', 15.00, '2025-01-01', '2026-12-31', 'ACTIF');
  SELECT id INTO STRICT v_contrat1_id FROM contrats WHERE logement_id = v_log1_id AND organisation_id = p_org_id;

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (p_org_id, v_log2_id, v_proprio1_id, 'GESTION_COMPLETE', 18.00, '2025-01-01', '2026-12-31', 'ACTIF');
  SELECT id INTO STRICT v_contrat2_id FROM contrats WHERE logement_id = v_log2_id AND organisation_id = p_org_id;

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (p_org_id, v_log3_id, v_proprio2_id, 'CONCIERGERIE', 12.00, '2025-01-01', '2026-12-31', 'ACTIF');
  SELECT id INTO STRICT v_contrat3_id FROM contrats WHERE logement_id = v_log3_id AND organisation_id = p_org_id;

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (p_org_id, v_log4_id, v_proprio2_id, 'GESTION_COMPLETE', 20.00, '2025-01-01', '2026-12-31', 'ACTIF');
  SELECT id INTO STRICT v_contrat4_id FROM contrats WHERE logement_id = v_log4_id AND organisation_id = p_org_id;

  INSERT INTO contrats (organisation_id, logement_id, proprietaire_id, type, commission_rate, start_date, end_date, status)
  VALUES (p_org_id, v_log5_id, v_proprio3_id, 'GESTION_LOCATIVE', 16.00, '2025-01-01', '2026-12-31', 'ACTIF');
  SELECT id INTO STRICT v_contrat5_id FROM contrats WHERE logement_id = v_log5_id AND organisation_id = p_org_id;

  -- ============================================================
  -- 4. PRESTATAIRES
  -- ============================================================
  RAISE NOTICE '🔧 Creating prestataires...';

  INSERT INTO prestataires (organisation_id, name, specialty, email, phone, reliability_score)
  VALUES (p_org_id, 'NetClean Pro', 'MENAGE', 'contact@netclean.fr', '+33 1 42 00 00 01', 5);
  SELECT id INTO STRICT v_prest1_id FROM prestataires WHERE name = 'NetClean Pro' AND organisation_id = p_org_id;

  INSERT INTO prestataires (organisation_id, name, specialty, email, phone, reliability_score)
  VALUES (p_org_id, 'Plomberie Express', 'PLOMBERIE', 'contact@plomberie-express.fr', '+33 1 42 00 00 02', 4);
  SELECT id INTO STRICT v_prest2_id FROM prestataires WHERE name = 'Plomberie Express' AND organisation_id = p_org_id;

  INSERT INTO prestataires (organisation_id, name, specialty, email, phone, reliability_score)
  VALUES (p_org_id, 'Électricité Plus', 'ELECTRICITE', 'contact@elec-plus.fr', '+33 1 42 00 00 03', 5);
  SELECT id INTO STRICT v_prest3_id FROM prestataires WHERE name = 'Électricité Plus' AND organisation_id = p_org_id;

  -- ============================================================
  -- 5. RÉSERVATIONS (Janvier-Février 2026)
  -- ============================================================
  RAISE NOTICE '📅 Creating réservations...';

  -- Studio Marais - 5 réservations
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log1_id, 'Alice Dupont', 'alice@example.com', '+33 6 11 11 11 11', '2026-01-05', '2026-01-10', 'AIRBNB', 450, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log1_id, 'Bob Smith', 'bob@example.com', '2026-01-12', '2026-01-15', 'BOOKING', 270, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log1_id, 'Clara Martin', 'clara@example.com', '2026-01-20', '2026-01-25', 'AIRBNB', 450, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log1_id, 'David Chen', 'david@example.com', '2026-02-01', '2026-02-07', 'DIRECT', 540, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log1_id, 'Emma Wilson', 'emma@example.com', '2026-02-10', '2026-02-14', 'BOOKING', 360, 'CONFIRMEE');

  -- Appartement Tour Eiffel - 6 réservations
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'François Leroy', 'francois@example.com', '2026-01-03', '2026-01-08', 'AIRBNB', 750, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'Giulia Rossi', 'giulia@example.com', '2026-01-10', '2026-01-17', 'BOOKING', 1050, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'Hans Mueller', 'hans@example.com', '2026-01-19', '2026-01-24', 'DIRECT', 750, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'Isabelle Petit', 'isabelle@example.com', '2026-01-26', '2026-02-02', 'AIRBNB', 1050, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'James Brown', 'james@example.com', '2026-02-05', '2026-02-10', 'BOOKING', 750, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log2_id, 'Karim Benzema', 'karim@example.com', '2026-02-12', '2026-02-15', 'AIRBNB', 450, 'CONFIRMEE');

  -- Loft Belleville - 4 réservations
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log3_id, 'Laura Garcia', 'laura@example.com', '2026-01-06', '2026-01-13', 'AIRBNB', 1400, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log3_id, 'Marco Polo', 'marco@example.com', '2026-01-15', '2026-01-22', 'DIRECT', 1400, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log3_id, 'Nina Simone', 'nina@example.com', '2026-01-25', '2026-02-01', 'BOOKING', 1400, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log3_id, 'Oscar Wilde', 'oscar@example.com', '2026-02-08', '2026-02-15', 'AIRBNB', 1400, 'CONFIRMEE');

  -- Duplex Montmartre - 4 réservations
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log4_id, 'Pierre Dubois', 'pierre@example.com', '2026-01-04', '2026-01-11', 'BOOKING', 1050, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log4_id, 'Quincy Jones', 'quincy@example.com', '2026-01-14', '2026-01-20', 'AIRBNB', 900, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log4_id, 'Rachel Green', 'rachel@example.com', '2026-01-23', '2026-01-30', 'DIRECT', 1050, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log4_id, 'Sophie Turner', 'sophie.t@example.com', '2026-02-03', '2026-02-09', 'BOOKING', 900, 'CONFIRMEE');

  -- Maison Saint-Germain - 3 réservations
  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log5_id, 'Thomas Anderson', 'thomas@example.com', '2026-01-07', '2026-01-14', 'AIRBNB', 2100, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log5_id, 'Uma Thurman', 'uma@example.com', '2026-01-18', '2026-01-25', 'DIRECT', 2100, 'CONFIRMEE');

  INSERT INTO reservations (organisation_id, logement_id, guest_name, guest_email, check_in_date, check_out_date, platform, amount, status)
  VALUES (p_org_id, v_log5_id, 'Vincent Cassel', 'vincent@example.com', '2026-02-01', '2026-02-08', 'BOOKING', 2100, 'CONFIRMEE');

  -- ============================================================
  -- 6. MISSIONS (Associated with reservations)
  -- ============================================================
  RAISE NOTICE '✅ Creating missions...';

  -- Create checkin/checkout missions for first 3 reservations of each logement
  INSERT INTO missions (organisation_id, logement_id, type, scheduled_at, assigned_to, status, notes)
  SELECT
    p_org_id,
    logement_id,
    'CHECKIN',
    check_in_date || ' 15:00:00',
    v_operateur_id,
    'TERMINEE',
    'Check-in ' || guest_name
  FROM reservations
  WHERE organisation_id = p_org_id
  AND status = 'CONFIRMEE'
  AND check_in_date < CURRENT_DATE
  LIMIT 10;

  INSERT INTO missions (organisation_id, logement_id, type, scheduled_at, assigned_to, status, notes, prestataire_id)
  SELECT
    p_org_id,
    logement_id,
    'MENAGE',
    check_out_date || ' 11:00:00',
    v_operateur_id,
    'TERMINEE',
    'Ménage complet',
    v_prest1_id
  FROM reservations
  WHERE organisation_id = p_org_id
  AND status = 'CONFIRMEE'
  AND check_out_date < CURRENT_DATE
  LIMIT 10;

  -- ============================================================
  -- 7. INCIDENTS
  -- ============================================================
  RAISE NOTICE '⚠️ Creating incidents...';

  INSERT INTO incidents (organisation_id, logement_id, title, description, priority, category, status, cost, opened_at, closed_at)
  VALUES (p_org_id, v_log2_id, 'Fuite d''eau salle de bain', 'Fuite au niveau du lavabo', 'HAUTE', 'PLOMBERIE', 'RESOLU', 180, '2026-01-15 10:00:00', '2026-01-15 16:00:00');

  INSERT INTO incidents (organisation_id, logement_id, title, description, priority, category, status, cost, opened_at, closed_at)
  VALUES (p_org_id, v_log3_id, 'Ampoule grillée', 'Remplacer ampoule chambre principale', 'BASSE', 'ELECTRICITE', 'RESOLU', 25, '2026-01-20 14:00:00', '2026-01-20 15:30:00');

  INSERT INTO incidents (organisation_id, logement_id, title, description, priority, category, status, opened_at)
  VALUES (p_org_id, v_log4_id, 'Chauffage ne fonctionne pas', 'Radiateur chambre 2 froid', 'HAUTE', 'CHAUFFAGE', 'EN_COURS', NULL, '2026-02-12 08:00:00');

  RAISE NOTICE '✅ Demo data created successfully!';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - 3 propriétaires';
  RAISE NOTICE '  - 5 logements';
  RAISE NOTICE '  - 5 contrats actifs (12-20%% commission)';
  RAISE NOTICE '  - 3 prestataires';
  RAISE NOTICE '  - 22 réservations (Jan-Feb 2026)';
  RAISE NOTICE '  - ~26,000€ CA brut';
  RAISE NOTICE '  - Missions & incidents created';

  RETURN 'Demo data created successfully for organisation ' || p_org_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_demo_data_for_org IS 'Creates complete demo data for a specific organisation. Clears existing demo data first.';

-- Helper function to get current user's organisation and seed demo data
CREATE OR REPLACE FUNCTION seed_demo_data_for_current_user()
RETURNS TEXT AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get organisation from current user's profile
  SELECT organisation_id INTO v_org_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organisation found for current user';
  END IF;

  RETURN seed_demo_data_for_org(v_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION seed_demo_data_for_current_user IS 'Seeds demo data for the current authenticated user''s organisation';
