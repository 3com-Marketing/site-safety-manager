ALTER TABLE public.configuracion_empresa
  ADD COLUMN registro_mercantil text NOT NULL DEFAULT '',
  ADD COLUMN iban text NOT NULL DEFAULT '',
  ADD COLUMN banco text NOT NULL DEFAULT '',
  ADD COLUMN swift_bic text NOT NULL DEFAULT '';