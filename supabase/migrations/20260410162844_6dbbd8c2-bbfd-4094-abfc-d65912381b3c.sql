
-- Add normativa column to 4 tables
ALTER TABLE public.anotaciones ADD COLUMN normativa text NOT NULL DEFAULT '';
ALTER TABLE public.incidencias ADD COLUMN normativa text NOT NULL DEFAULT '';
ALTER TABLE public.observaciones ADD COLUMN normativa text NOT NULL DEFAULT '';
ALTER TABLE public.amonestaciones ADD COLUMN normativa text NOT NULL DEFAULT '';

-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public) VALUES ('informes-pdf', 'informes-pdf', true);

-- Storage policies for informes-pdf bucket
CREATE POLICY "Anyone can read informes PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'informes-pdf');

CREATE POLICY "Authenticated can upload informes PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'informes-pdf' AND auth.role() = 'authenticated');
