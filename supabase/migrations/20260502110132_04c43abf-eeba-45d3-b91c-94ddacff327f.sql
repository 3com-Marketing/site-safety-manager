-- Tabla de categorías
CREATE TABLE public.signo_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signo_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view signo_categorias"
  ON public.signo_categorias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage signo_categorias"
  ON public.signo_categorias FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabla de señales
CREATE TABLE public.signos_obra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES public.signo_categorias(id) ON DELETE RESTRICT,
  imagen_url TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signos_obra_categoria ON public.signos_obra(categoria_id);

ALTER TABLE public.signos_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view signos_obra"
  ON public.signos_obra FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage signos_obra"
  ON public.signos_obra FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Bucket de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES ('signos-obra', 'signos-obra', true);

CREATE POLICY "Public read signos-obra"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signos-obra');

CREATE POLICY "Admins upload signos-obra"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signos-obra' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update signos-obra"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signos-obra' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete signos-obra"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'signos-obra' AND has_role(auth.uid(), 'admin'::app_role));