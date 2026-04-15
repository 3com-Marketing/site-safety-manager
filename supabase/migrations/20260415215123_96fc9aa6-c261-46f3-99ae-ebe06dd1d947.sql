
ALTER TABLE public.tecnicos
  ADD COLUMN tipo text NOT NULL DEFAULT 'tecnico',
  ADD COLUMN apellidos text NOT NULL DEFAULT '',
  ADD COLUMN dni text NOT NULL DEFAULT '',
  ADD COLUMN titulacion text NOT NULL DEFAULT '',
  ADD COLUMN num_colegiado text NOT NULL DEFAULT '',
  ADD COLUMN empresa text NOT NULL DEFAULT '',
  ADD COLUMN cif_empresa text NOT NULL DEFAULT '',
  ADD COLUMN movil text NOT NULL DEFAULT '';
