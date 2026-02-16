-- ============================================================
-- Script de nettoyage des données ConciergeOS
-- ============================================================

-- OPTION 1: Nettoyer TOUTES les données de TOUTES les organisations
-- ⚠️ DANGER: Supprime TOUT (sauf la structure des tables)
-- ============================================================

/*
TRUNCATE TABLE mission_checklist_items CASCADE;
TRUNCATE TABLE checklist_template_items CASCADE;
TRUNCATE TABLE checklist_templates CASCADE;
TRUNCATE TABLE equipements CASCADE;
TRUNCATE TABLE revenus CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE missions CASCADE;
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE contrats CASCADE;
TRUNCATE TABLE logements CASCADE;
TRUNCATE TABLE prestataires CASCADE;
TRUNCATE TABLE proprietaires CASCADE;
TRUNCATE TABLE invitations CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE organisations CASCADE;

-- Note: factures_prestataires n'existe pas encore (Phase 3)
*/

-- ============================================================
-- OPTION 2: Nettoyer les données d'UNE organisation spécifique
-- Plus sûr: garde les autres organisations intactes
-- ============================================================

DO $$
DECLARE
  v_org_id UUID := '890c5502-c4f0-4df9-8577-ce7aa46b1f40'; -- ⬅️ CHANGE MOI
BEGIN
  RAISE NOTICE 'Nettoyage des données pour organisation: %', v_org_id;

  -- Supprime les données avec organisation_id direct
  -- CASCADE supprimera automatiquement les tables liées (mission_checklist_items, etc.)
  DELETE FROM checklist_templates WHERE organisation_id = v_org_id;
  DELETE FROM equipements WHERE organisation_id = v_org_id;
  DELETE FROM revenus WHERE organisation_id = v_org_id;
  DELETE FROM attachments WHERE organisation_id = v_org_id;
  DELETE FROM incidents WHERE organisation_id = v_org_id;
  DELETE FROM missions WHERE organisation_id = v_org_id;
  DELETE FROM reservations WHERE organisation_id = v_org_id;
  DELETE FROM contrats WHERE organisation_id = v_org_id;
  DELETE FROM logements WHERE organisation_id = v_org_id;
  DELETE FROM prestataires WHERE organisation_id = v_org_id;
  DELETE FROM proprietaires WHERE organisation_id = v_org_id;
  DELETE FROM invitations WHERE organisation_id = v_org_id;
  DELETE FROM notifications WHERE organisation_id = v_org_id;

  -- Ne supprime PAS profiles ni organisations (garde le compte admin)
  -- Les tables liées (mission_checklist_items, checklist_template_items)
  -- sont automatiquement supprimées par ON DELETE CASCADE

  RAISE NOTICE '✅ Données nettoyées avec succès!';
  RAISE NOTICE 'Organisation et profils admin conservés.';
END $$;

-- ============================================================
-- OPTION 3: Supprimer complètement une organisation
-- ⚠️ DANGER: Supprime l'organisation + tous les utilisateurs
-- ============================================================

/*
DO $$
DECLARE
  v_org_id UUID := '890c5502-c4f0-4df9-8577-ce7aa46b1f40'; -- ⬅️ CHANGE MOI
BEGIN
  RAISE NOTICE 'Suppression COMPLÈTE de l''organisation: %', v_org_id;

  -- Supprime l'organisation (CASCADE supprime tout le reste)
  DELETE FROM organisations WHERE id = v_org_id;

  RAISE NOTICE '✅ Organisation supprimée avec succès!';
  RAISE NOTICE '⚠️ Les utilisateurs de cette org ont perdu leur accès.';
END $$;
*/

-- ============================================================
-- OPTION 4: Nettoyer SEULEMENT les données de démo
-- Garde les vraies données, supprime les @example.com
-- ============================================================

/*
DO $$
DECLARE
  v_org_id UUID := '890c5502-c4f0-4df9-8577-ce7aa46b1f40'; -- ⬅️ CHANGE MOI
BEGIN
  RAISE NOTICE 'Nettoyage des données de démo...';

  -- Supprime les propriétaires de démo (et cascade vers logements, contrats, etc.)
  DELETE FROM proprietaires
  WHERE organisation_id = v_org_id
    AND email LIKE '%@example.com';

  -- Supprime les prestataires de démo
  DELETE FROM prestataires
  WHERE organisation_id = v_org_id
    AND (
      email LIKE '%@netclean.fr'
      OR email LIKE '%@plomberie-express.fr'
      OR email LIKE '%@elec-plus.fr'
    );

  RAISE NOTICE '✅ Données de démo nettoyées!';
END $$;
*/
