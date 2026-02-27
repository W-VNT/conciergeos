-- Enable pg_cron extension if not already enabled (skip if already exists with privileges)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Grant permissions to execute cron jobs
DO $$ BEGIN
  GRANT USAGE ON SCHEMA cron TO postgres;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Unschedule existing jobs to avoid duplicates on re-run
DO $$ BEGIN
  PERFORM cron.unschedule('checkin-reminders');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('checkout-notifications');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('urgent-missions-check');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('critical-incidents-check');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

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

DO $$ BEGIN
  COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
