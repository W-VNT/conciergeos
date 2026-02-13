-- ============================================================
-- ConciergeOS — Seed Data (for local development)
-- Run AFTER creating a user via Supabase Auth
-- Replace the UUIDs with your actual auth user id and org id
-- ============================================================

-- Example: create an organisation
-- INSERT INTO public.organisations (id, name)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Ma Conciergerie');

-- Example: create admin profile (id must match auth.users id)
-- INSERT INTO public.profiles (id, organisation_id, full_name, role)
-- VALUES ('YOUR_AUTH_USER_UUID', '00000000-0000-0000-0000-000000000001', 'Admin User', 'ADMIN');

-- NOTE: In the app, onboarding auto-creates org + profile on first login.
-- This seed is only needed if you want to pre-populate data.
