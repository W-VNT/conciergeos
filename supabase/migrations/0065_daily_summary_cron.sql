-- Enable pg_cron extension for scheduled jobs (skip if already exists with privileges)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Unschedule existing job if it exists (to avoid duplicates on re-run)
DO $$ BEGIN
  PERFORM cron.unschedule('daily-mission-summary');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule daily mission summary email
-- Runs every day at 7:00 AM
SELECT cron.schedule(
  'daily-mission-summary',
  '0 7 * * *',
  $$
  SELECT extensions.http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/daily-mission-summary',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  $$
);
