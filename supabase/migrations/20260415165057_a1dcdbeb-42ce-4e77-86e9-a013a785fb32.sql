ALTER TABLE public.configuracion_empresa
  ADD COLUMN texto_acta_reunion_inicial text NOT NULL DEFAULT '',
  ADD COLUMN texto_acta_reunion_cae text NOT NULL DEFAULT '',
  ADD COLUMN texto_acta_reunion_sys text NOT NULL DEFAULT '';