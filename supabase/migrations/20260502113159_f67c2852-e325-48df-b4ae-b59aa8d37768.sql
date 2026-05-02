ALTER TABLE public.signos_obra ADD COLUMN IF NOT EXISTS archivo_original text;
CREATE INDEX IF NOT EXISTS idx_signos_obra_archivo_original ON public.signos_obra (lower(archivo_original));