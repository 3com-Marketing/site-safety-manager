
-- Table: observaciones
CREATE TABLE public.observaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id uuid NOT NULL REFERENCES public.informes(id) ON DELETE CASCADE,
  texto text NOT NULL DEFAULT '',
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view observaciones"
  ON public.observaciones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners and admins can insert observaciones"
  ON public.observaciones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = observaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins can update observaciones"
  ON public.observaciones FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = observaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins can delete observaciones"
  ON public.observaciones FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = observaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

-- Table: amonestaciones
CREATE TABLE public.amonestaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  informe_id uuid NOT NULL REFERENCES public.informes(id) ON DELETE CASCADE,
  trabajador text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.amonestaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view amonestaciones"
  ON public.amonestaciones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners and admins can insert amonestaciones"
  ON public.amonestaciones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = amonestaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins can update amonestaciones"
  ON public.amonestaciones FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = amonestaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners and admins can delete amonestaciones"
  ON public.amonestaciones FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM informes
      JOIN visitas ON visitas.id = informes.visita_id
      WHERE informes.id = amonestaciones.informe_id
        AND visitas.usuario_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

-- Add columns to informes for Datos Generales
ALTER TABLE public.informes
  ADD COLUMN IF NOT EXISTS num_trabajadores integer,
  ADD COLUMN IF NOT EXISTS condiciones_climaticas text DEFAULT '',
  ADD COLUMN IF NOT EXISTS empresas_presentes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notas_generales text DEFAULT '';
