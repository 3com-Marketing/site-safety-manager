ALTER TABLE public.informes
  ADD COLUMN IF NOT EXISTS firma_url text,
  ADD COLUMN IF NOT EXISTS firma_at timestamptz;

CREATE POLICY "Authenticated can upload firmas-informes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-informes'
);

CREATE POLICY "Authenticated can update firmas-informes"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-informes'
);

CREATE POLICY "Authenticated can delete firmas-informes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-informes'
);

CREATE POLICY "Anyone can read firmas-informes"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-informes'
);