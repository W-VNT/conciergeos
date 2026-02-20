-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule existing job if it exists (to avoid duplicates on re-run)
SELECT extensions.cron.unschedule('daily-mission-summary')
WHERE EXISTS (
  SELECT 1 FROM extensions.cron.job WHERE jobname = 'daily-mission-summary'
);

-- Schedule daily mission summary email
-- Runs every day at 7:00 AM
SELECT extensions.cron.schedule(
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

-- Add comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS
'Scheduled jobs extension. Used to send daily mission summary emails at 7:00 AM.';
