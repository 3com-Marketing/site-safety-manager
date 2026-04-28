-- Storage policies for firmas-documentos/ prefix in logos bucket
CREATE POLICY "Authenticated can upload firmas-documentos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-documentos'
);

CREATE POLICY "Authenticated can update firmas-documentos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-documentos'
);

CREATE POLICY "Authenticated can delete firmas-documentos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-documentos'
);

CREATE POLICY "Anyone can read firmas-documentos"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'firmas-documentos'
);