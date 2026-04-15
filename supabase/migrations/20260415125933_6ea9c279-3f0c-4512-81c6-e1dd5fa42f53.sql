
CREATE TABLE public.configuracion_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT '',
  cif text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  ciudad text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  web text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  nombre_responsable text NOT NULL DEFAULT '',
  cargo_responsable text NOT NULL DEFAULT '',
  titulacion text NOT NULL DEFAULT '',
  num_colegiado text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.configuracion_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage config" ON public.configuracion_empresa FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth can view config" ON public.configuracion_empresa FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_configuracion_empresa_updated_at
  BEFORE UPDATE ON public.configuracion_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
