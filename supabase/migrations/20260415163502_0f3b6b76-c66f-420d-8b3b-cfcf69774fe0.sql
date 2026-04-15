
ALTER TABLE public.configuracion_empresa
  ADD COLUMN texto_acta_aprobacion_sys text NOT NULL DEFAULT '',
  ADD COLUMN texto_acta_aprobacion_dgpo text NOT NULL DEFAULT '';
