-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to execute cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 1. Rappels check-in (quotidien à 8h00 UTC)
-- Envoie des rappels pour les check-ins prévus demain
SELECT cron.schedule(
  'checkin-reminders',
  '0 8 * * *',
  $$SELECT send_checkin_reminders()$$
);

-- 2. Notifications check-out (quotidien à 7h00 UTC)
-- Envoie des notifications pour les check-outs du jour
SELECT cron.schedule(
  'checkout-notifications',
  '0 7 * * *',
  $$SELECT send_checkout_today_notifications()$$
);

-- 3. Alertes missions urgentes (toutes les heures)
-- Vérifie les missions urgentes non assignées dans les prochaines 24h
SELECT cron.schedule(
  'urgent-missions-check',
  '0 * * * *',
  $$SELECT check_urgent_missions()$$
);

-- 4. Alertes incidents critiques (toutes les heures)
-- Vérifie les incidents critiques ouverts depuis plus de 2h
SELECT cron.schedule(
  'critical-incidents-check',
  '0 * * * *',
  $$SELECT check_critical_incidents()$$
);

-- Vérifier que les cron jobs sont bien créés
SELECT jobid, schedule, command, nodename, nodeport, database, username, active
FROM cron.job
ORDER BY jobid;

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
