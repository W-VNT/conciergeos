-- Migration: Disable revenus triggers temporarily
-- Description: Remove revenus-related triggers and functions until Finance section is implemented
-- This prevents errors when creating reservations while the revenus table doesn't exist yet

-- ============================================================
-- Drop triggers
-- ============================================================

DROP TRIGGER IF EXISTS trigger_auto_create_revenu ON reservations;
DROP TRIGGER IF EXISTS trigger_calculate_commission ON revenus;

-- ============================================================
-- Drop functions
-- ============================================================

DROP FUNCTION IF EXISTS auto_create_revenu();
DROP FUNCTION IF EXISTS calculate_commission_for_reservation();
DROP FUNCTION IF EXISTS sync_existing_reservations_to_revenus();

-- Note: These will be re-enabled when the Finance section (revenus table) is properly implemented
