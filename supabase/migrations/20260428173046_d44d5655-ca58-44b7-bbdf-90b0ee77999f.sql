ALTER TABLE public.tecnicos
  ADD COLUMN IF NOT EXISTS firma_url text,
  ADD COLUMN IF NOT EXISTS firma_actualizada_at timestamptz;

-- Storage policies for firmas/ prefix in logos bucket
CREATE POLICY "Admins can upload firmas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update firmas"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete firmas"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can read firmas"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas'
);