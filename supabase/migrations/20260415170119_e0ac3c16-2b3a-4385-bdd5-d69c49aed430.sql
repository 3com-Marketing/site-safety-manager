ALTER TABLE public.configuracion_empresa
  ADD COLUMN texto_acta_nombramiento_cae text NOT NULL DEFAULT '',
  ADD COLUMN texto_acta_nombramiento_proyecto text NOT NULL DEFAULT '';