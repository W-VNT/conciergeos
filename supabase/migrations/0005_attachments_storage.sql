-- ============================================================
-- ConciergeOS — Attachments & Storage
-- ============================================================

CREATE TYPE public.entity_type AS ENUM ('LOGEMENT', 'MISSION', 'INCIDENT');

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  entity_type public.entity_type NOT NULL,
  entity_id uuid NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_attachments_org ON public.attachments(organisation_id);
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);

-- RLS
CREATE POLICY "attachments_select" ON public.attachments FOR SELECT
  USING (organisation_id = public.get_my_org_id());

CREATE POLICY "attachments_insert" ON public.attachments FOR INSERT
  WITH CHECK (organisation_id = public.get_my_org_id());

CREATE POLICY "attachments_delete" ON public.attachments FOR DELETE
  USING (organisation_id = public.get_my_org_id());

-- ============================================================
-- Storage bucket "attachments" — create via Supabase dashboard or CLI:
--
--   1. Go to Storage → New Bucket → name: "attachments" → Private
--   2. Add policies:
--
--   SELECT policy (read):
--     bucket_id = 'attachments'
--     AND (storage.foldername(name))[1] IN (
--       SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
--     )
--
--   INSERT policy (upload):
--     bucket_id = 'attachments'
--     AND (storage.foldername(name))[1] IN (
--       SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
--     )
--
--   DELETE policy:
--     bucket_id = 'attachments'
--     AND (storage.foldername(name))[1] IN (
--       SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
--     )
--
-- File paths follow: {organisation_id}/{entity_type}/{entity_id}/{filename}
-- ============================================================

-- Try to create the bucket (works if using supabase CLI migration)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "attachments_storage_select" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "attachments_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "attachments_storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT organisation_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
