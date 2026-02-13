-- ============================================================
-- ConciergeOS — Foundation Migration
-- Tables: organisations, profiles
-- Enums: user_role
-- RLS policies for multi-tenant isolation
-- ============================================================

-- Enums
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'OPERATEUR');

-- Organisations
CREATE TABLE public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'ADMIN',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_profiles_organisation ON public.profiles(organisation_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Organisations: users can only see their own org
CREATE POLICY "Users can view own organisation"
  ON public.organisations FOR SELECT
  USING (
    id IN (SELECT organisation_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own organisation"
  ON public.organisations FOR UPDATE
  USING (
    id IN (SELECT organisation_id FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles: users can only see profiles in their org
CREATE POLICY "Users can view profiles in own org"
  ON public.profiles FOR SELECT
  USING (
    organisation_id IN (SELECT organisation_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- Helper function: get current user's organisation_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- Helper function: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
