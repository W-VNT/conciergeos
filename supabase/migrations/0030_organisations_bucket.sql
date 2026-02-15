-- Create storage bucket for organisation logos

INSERT INTO storage.buckets (id, name, public)
VALUES ('organisations', 'organisations', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for organisations bucket

-- Admins can upload their organisation logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Admins can upload org logo'
  ) THEN
    CREATE POLICY "Admins can upload org logo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organisations' AND
      (storage.foldername(name))[1] IN (
        SELECT organisation_id::text FROM profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    );
  END IF;
END $$;

-- Logos are publicly accessible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Organisation logos are public'
  ) THEN
    CREATE POLICY "Organisation logos are public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'organisations');
  END IF;
END $$;

-- Admins can update their organisation logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Admins can update org logo'
  ) THEN
    CREATE POLICY "Admins can update org logo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organisations' AND
      (storage.foldername(name))[1] IN (
        SELECT organisation_id::text FROM profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    );
  END IF;
END $$;

-- Admins can delete their organisation logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Admins can delete org logo'
  ) THEN
    CREATE POLICY "Admins can delete org logo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organisations' AND
      (storage.foldername(name))[1] IN (
        SELECT organisation_id::text FROM profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    );
  END IF;
END $$;
