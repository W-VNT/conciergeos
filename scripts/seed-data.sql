-- Script to seed demo data for ConciergeOS
-- Corrected with exact schema from migrations

DO $$
DECLARE
  current_org_id UUID;
  prop1_id UUID;
  prop2_id UUID;
  prop3_id UUID;
  prop4_id UUID;
  prop5_id UUID;
  log1_id UUID;
  log2_id UUID;
  log3_id UUID;
  log4_id UUID;
  log5_id UUID;
  log6_id UUID;
  log7_id UUID;
  log8_id UUID;
  prest1_id UUID;
  prest2_id UUID;
  prest3_id UUID;
  prest4_id UUID;
  prest5_id UUID;
  prest6_id UUID;
BEGIN
  -- Get the most recent organisation
  SELECT id INTO current_org_id FROM organisations ORDER BY created_at DESC LIMIT 1;

  RAISE NOTICE 'Seeding data for organisation: %', current_org_id;

  -- Insert Propriétaires (service_level: STANDARD or VIP)
  INSERT INTO proprietaires (organisation_id, full_name, email, phone, service_level) VALUES
  (current_org_id, 'Sophie Martin', 'sophie.martin@example.fr', '+33612345678', 'VIP') RETURNING id INTO prop1_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone, service_level) VALUES
  (current_org_id, 'Jean Dupont', 'jean.dupont@example.fr', '+33623456789', 'STANDARD') RETURNING id INTO prop2_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone, service_level) VALUES
  (current_org_id, 'Marie Lefebvre', 'marie.lefebvre@example.fr', '+33634567890', 'VIP') RETURNING id INTO prop3_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone, service_level) VALUES
  (current_org_id, 'Azur Invest SAS', 'contact@azurvest.fr', '+33645678901', 'VIP') RETURNING id INTO prop4_id;

  INSERT INTO proprietaires (organisation_id, full_name, email, phone, service_level) VALUES
  (current_org_id, 'Pierre Moreau', 'pierre.moreau@example.fr', '+33656789012', 'STANDARD') RETURNING id INTO prop5_id;

  RAISE NOTICE '✓ Inserted 5 proprietaires';

  -- Insert Logements (owner_id, address_line1, wifi_name, offer_tier)
  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password, offer_tier, status) VALUES
  (current_org_id, prop1_id, 'Appartement Promenade', '12 Promenade des Anglais', 'Nice', '06000', '1234', 'Promenade_WiFi', 'NiceView2024', 'SIGNATURE', 'ACTIF') RETURNING id INTO log1_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password, offer_tier, status) VALUES
  (current_org_id, prop1_id, 'Studio Port', '8 Quai Rauba Capeu', 'Nice', '06300', '5678', 'PortNice_5G', 'Harbor2024!', 'SIGNATURE', 'ACTIF') RETURNING id INTO log2_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, offer_tier, status) VALUES
  (current_org_id, prop2_id, 'Villa Cannes', '45 Boulevard de la Croisette', 'Cannes', '06400', '9012', 'ESSENTIEL', 'ACTIF') RETURNING id INTO log3_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password, offer_tier, status) VALUES
  (current_org_id, prop3_id, 'T2 Antibes', '23 Avenue du Général de Gaulle', 'Antibes', '06600', '3456', 'Antibes_Home', 'Seaside123', 'SERENITE', 'ACTIF') RETURNING id INTO log4_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, status) VALUES
  (current_org_id, prop4_id, 'Studio Monaco', '7 Avenue Princesse Grace', 'Monaco', '98000', 'SERENITE', 'ACTIF') RETURNING id INTO log5_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password, offer_tier, status) VALUES
  (current_org_id, prop4_id, 'T3 Menton', '18 Promenade du Soleil', 'Menton', '06500', '7890', 'Menton_Guest', 'Lemon2024', 'SERENITE', 'ACTIF') RETURNING id INTO log6_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, offer_tier, status) VALUES
  (current_org_id, prop5_id, 'Appartement Grasse', '32 Rue Jean Ossola', 'Grasse', '06130', 'ESSENTIEL', 'ACTIF') RETURNING id INTO log7_id;

  INSERT INTO logements (organisation_id, owner_id, name, address_line1, city, postal_code, lockbox_code, offer_tier, status) VALUES
  (current_org_id, prop3_id, 'Penthouse Nice Nord', '5 Avenue Malausséna', 'Nice', '06000', '1111', 'SIGNATURE', 'PAUSE') RETURNING id INTO log8_id;

  RAISE NOTICE '✓ Inserted 8 logements';

  -- Insert Prestataires (full_name, specialty: MENAGE, PLOMBERIE, ELECTRICITE, CLIM, AUTRE)
  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'CleanPro Nice', 'MENAGE', 'contact@cleanpro-nice.fr', '+33493123456') RETURNING id INTO prest1_id;

  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'AzurPlomberie', 'PLOMBERIE', 'urgence@azurplomberie.fr', '+33493234567') RETURNING id INTO prest2_id;

  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'ElectroCôte', 'ELECTRICITE', 'contact@electrocote.fr', '+33493345678') RETURNING id INTO prest3_id;

  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'Jardin Azur', 'AUTRE', 'info@jardinazur.fr', '+33493456789') RETURNING id INTO prest4_id;

  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'ClimExpress', 'CLIM', 'contact@climexpress.fr', '+33493567890') RETURNING id INTO prest5_id;

  INSERT INTO prestataires (organisation_id, full_name, specialty, email, phone) VALUES
  (current_org_id, 'NetService Riviera', 'MENAGE', 'planning@netservice.fr', '+33493678901') RETURNING id INTO prest6_id;

  RAISE NOTICE '✓ Inserted 6 prestataires';

  -- Insert Missions (type: CHECKIN, CHECKOUT, MENAGE; status: A_FAIRE, EN_COURS, TERMINE)
  INSERT INTO missions (organisation_id, logement_id, type, status, scheduled_at, completed_at, notes) VALUES
  (current_org_id, log1_id, 'CHECKIN', 'TERMINE', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'Accueil famille britannique'),
  (current_org_id, log1_id, 'CHECKOUT', 'TERMINE', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'Logement rendu propre'),
  (current_org_id, log1_id, 'MENAGE', 'EN_COURS', NOW() + INTERVAL '2 hours', NULL, 'Ménage complet avant prochains locataires'),
  (current_org_id, log2_id, 'CHECKIN', 'A_FAIRE', NOW() + INTERVAL '1 day', NULL, 'Arrivée prévue à 15h'),
  (current_org_id, log3_id, 'CHECKOUT', 'A_FAIRE', NOW() + INTERVAL '2 days', NULL, 'Départ prévu à 11h'),
  (current_org_id, log3_id, 'MENAGE', 'A_FAIRE', NOW() + INTERVAL '2 days' + INTERVAL '3 hours', NULL, 'Après check-out'),
  (current_org_id, log4_id, 'CHECKIN', 'TERMINE', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Locataires longue durée'),
  (current_org_id, log4_id, 'INTERVENTION', 'TERMINE', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'État des lieux'),
  (current_org_id, log5_id, 'MENAGE', 'TERMINE', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'Ménage hebdomadaire'),
  (current_org_id, log5_id, 'MENAGE', 'A_FAIRE', NOW() + INTERVAL '5 days', NULL, 'Prochain ménage hebdomadaire'),
  (current_org_id, log6_id, 'CHECKIN', 'EN_COURS', NOW(), NULL, 'Locataires en route'),
  (current_org_id, log6_id, 'INTERVENTION', 'A_FAIRE', NOW() + INTERVAL '1 hour', NULL, 'État des lieux pendant check-in'),
  (current_org_id, log7_id, 'MENAGE', 'A_FAIRE', NOW() + INTERVAL '3 days', NULL, 'Ménage de routine'),
  (current_org_id, log2_id, 'INTERVENTION', 'A_FAIRE', NOW() + INTERVAL '1 day', NULL, 'Avant arrivée'),
  (current_org_id, log4_id, 'MENAGE', 'A_FAIRE', NOW() + INTERVAL '4 days', NULL, 'Ménage mi-séjour'),
  (current_org_id, log1_id, 'INTERVENTION', 'A_FAIRE', NOW() + INTERVAL '6 days', NULL, 'Contrôle après ménage'),
  (current_org_id, log3_id, 'CHECKIN', 'A_FAIRE', NOW() + INTERVAL '8 days', NULL, 'Nouveaux locataires');

  RAISE NOTICE '✓ Inserted 17 missions';

  -- Insert Incidents (severity: MINEUR, MOYEN, CRITIQUE; status: OUVERT, EN_COURS, RESOLU)
  INSERT INTO incidents (organisation_id, logement_id, prestataire_id, description, severity, status, opened_at, resolved_at, cost) VALUES
  (current_org_id, log1_id, prest2_id, 'Fuite d''eau salle de bain - Fuite sous le lavabo, intervention urgente nécessaire', 'CRITIQUE', 'RESOLU', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 180.00),
  (current_org_id, log2_id, prest3_id, 'Prise électrique cuisine HS - La prise près du frigo ne fonctionne plus', 'MOYEN', 'EN_COURS', NOW() - INTERVAL '2 days', NULL, 85.00),
  (current_org_id, log3_id, NULL, 'Clim ne refroidit plus - Climatisation salon souffle de l''air chaud', 'CRITIQUE', 'OUVERT', NOW() - INTERVAL '1 day', NULL, NULL),
  (current_org_id, log4_id, prest1_id, 'Tache moquette chambre - Tache de vin rouge sur moquette', 'MINEUR', 'RESOLU', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 120.00),
  (current_org_id, log5_id, prest5_id, 'Clim bruyante - Bruit anormal unité extérieure', 'MOYEN', 'EN_COURS', NOW() - INTERVAL '3 days', NULL, 150.00),
  (current_org_id, log6_id, NULL, 'Volet roulant bloqué - Volet chambre principale bloqué en position basse', 'MINEUR', 'OUVERT', NOW(), NULL, NULL),
  (current_org_id, log1_id, prest2_id, 'Chasse d''eau WC fuit - Eau coule en continu dans la cuvette', 'MOYEN', 'RESOLU', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 95.00),
  (current_org_id, log2_id, NULL, 'Ampoule grillée couloir - Ampoule LED couloir à remplacer', 'MINEUR', 'OUVERT', NOW() - INTERVAL '1 day', NULL, NULL);

  RAISE NOTICE '✓ Inserted 8 incidents';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Demo data seeded successfully!';
  RAISE NOTICE 'Organisation ID: %', current_org_id;
  RAISE NOTICE '5 proprietaires, 8 logements, 6 prestataires, 17 missions, 8 incidents';
END $$;
