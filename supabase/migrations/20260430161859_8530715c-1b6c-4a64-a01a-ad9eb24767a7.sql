ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS firma_responsable_url text,
  ADD COLUMN IF NOT EXISTS firma_responsable_nombre text,
  ADD COLUMN IF NOT EXISTS firma_responsable_cargo text,
  ADD COLUMN IF NOT EXISTS firma_tecnico_url text,
  ADD COLUMN IF NOT EXISTS firmas_at timestamptz;