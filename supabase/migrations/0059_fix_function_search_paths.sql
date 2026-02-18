-- Fix: Set immutable search_path on all public functions (security best practice)

-- Trigger functions (no parameters)
ALTER FUNCTION public.calculate_commission_for_reservation() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.auto_create_revenu() SET search_path = '';
ALTER FUNCTION public.notify_critical_incident() SET search_path = '';
ALTER FUNCTION public.notify_team_invitation() SET search_path = '';
ALTER FUNCTION public.notify_mission_assigned() SET search_path = '';
ALTER FUNCTION public.notify_urgent_mission() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.update_contract_status() SET search_path = '';

-- Regular functions (no parameters)
ALTER FUNCTION public.notify_expiring_contracts() SET search_path = '';
ALTER FUNCTION public.sync_existing_reservations_to_revenus() SET search_path = '';
ALTER FUNCTION public.seed_demo_data_for_current_user() SET search_path = '';

-- Functions with parameters (full signature required)
ALTER FUNCTION public.create_notification(UUID, UUID, notification_type, TEXT, TEXT, entity_type, UUID) SET search_path = '';
ALTER FUNCTION public.create_notification(UUID, UUID, notification_type, TEXT, TEXT, entity_type, UUID, JSONB) SET search_path = '';
ALTER FUNCTION public.get_revenus_summary(UUID, DATE, DATE) SET search_path = '';
ALTER FUNCTION public.seed_demo_data_for_org(UUID) SET search_path = '';

-- Fix: Restrict "System can create notifications" INSERT policy to service_role only
-- (create_notification is SECURITY DEFINER so authenticated policy is unused)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);
