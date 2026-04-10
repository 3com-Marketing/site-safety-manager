
CREATE TABLE public.tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  codigo_tecnico TEXT NOT NULL DEFAULT '',
  notas TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tecnicos"
  ON public.tecnicos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tecnicos"
  ON public.tecnicos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
