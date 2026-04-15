ALTER TABLE public.configuracion_empresa
  ADD COLUMN texto_recomendaciones text NOT NULL DEFAULT '',
  ADD COLUMN texto_normativa text NOT NULL DEFAULT '';