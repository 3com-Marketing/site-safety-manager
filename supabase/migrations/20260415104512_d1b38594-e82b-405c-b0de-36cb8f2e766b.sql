
-- Enums
CREATE TYPE public.tipo_documento AS ENUM (
  'acta_nombramiento_cae',
  'acta_nombramiento_proyecto',
  'acta_aprobacion_dgpo',
  'acta_aprobacion_plan_sys',
  'acta_reunion_cae',
  'acta_reunion_inicial',
  'acta_reunion_sys',
  'informe_css',
  'informe_at'
);

CREATE TYPE public.estado_documento AS ENUM (
  'pendiente',
  'generado',
  'adjuntado',
  'firmado'
);

-- Main documents table
CREATE TABLE public.documentos_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tipo public.tipo_documento NOT NULL,
  estado public.estado_documento NOT NULL DEFAULT 'pendiente',
  titulo text,
  fecha_documento date,
  nombre_coordinador text,
  dni_coordinador text,
  titulacion_colegiado text,
  empresa_coordinacion text,
  cif_empresa text,
  domicilio_empresa text,
  movil_coordinador text,
  email_coordinador text,
  nombre_promotor text,
  cif_promotor text,
  domicilio_promotor text,
  datos_extra jsonb DEFAULT '{}',
  archivo_url text,
  archivo_nombre text,
  creado_por uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meeting attendees
CREATE TABLE public.asistentes_reunion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos_obra(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellidos text,
  cargo text,
  empresa text,
  dni_nie text,
  firma_url text,
  created_at timestamptz DEFAULT now()
);

-- CAE meeting activities
CREATE TABLE public.actividades_reunion_cae (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos_obra(id) ON DELETE CASCADE,
  actividad text NOT NULL,
  numero_pedido text,
  orden int DEFAULT 0
);

-- Companies accessing the site
CREATE TABLE public.empresas_acceso_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES public.documentos_obra(id) ON DELETE CASCADE,
  empresa text NOT NULL,
  persona_contacto text,
  email_referencia text
);

-- RLS
ALTER TABLE public.documentos_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistentes_reunion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades_reunion_cae ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_acceso_obra ENABLE ROW LEVEL SECURITY;

-- documentos_obra policies
CREATE POLICY "Admins full access documentos" ON public.documentos_obra
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tecnicos ven documentos de sus obras" ON public.documentos_obra
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tecnicos_obras to2
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE to2.obra_id = documentos_obra.obra_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Tecnicos pueden crear documentos en sus obras" ON public.documentos_obra
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tecnicos_obras to2
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE to2.obra_id = documentos_obra.obra_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Tecnicos pueden actualizar documentos en sus obras" ON public.documentos_obra
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tecnicos_obras to2
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE to2.obra_id = documentos_obra.obra_id
      AND t.user_id = auth.uid()
    )
  );

-- asistentes_reunion policies
CREATE POLICY "Admins full access asistentes" ON public.asistentes_reunion
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tecnicos acceso asistentes" ON public.asistentes_reunion
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos_obra d
      JOIN public.tecnicos_obras to2 ON to2.obra_id = d.obra_id
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE d.id = asistentes_reunion.documento_id AND t.user_id = auth.uid()
    )
  );

-- actividades_reunion_cae policies
CREATE POLICY "Admins full access actividades" ON public.actividades_reunion_cae
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tecnicos acceso actividades" ON public.actividades_reunion_cae
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos_obra d
      JOIN public.tecnicos_obras to2 ON to2.obra_id = d.obra_id
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE d.id = actividades_reunion_cae.documento_id AND t.user_id = auth.uid()
    )
  );

-- empresas_acceso_obra policies
CREATE POLICY "Admins full access empresas" ON public.empresas_acceso_obra
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tecnicos acceso empresas" ON public.empresas_acceso_obra
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos_obra d
      JOIN public.tecnicos_obras to2 ON to2.obra_id = d.obra_id
      JOIN public.tecnicos t ON t.id = to2.tecnico_id
      WHERE d.id = empresas_acceso_obra.documento_id AND t.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentos_obra_updated_at
  BEFORE UPDATE ON public.documentos_obra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-obra', 'documentos-obra', true);

-- Storage policies
CREATE POLICY "Authenticated can view documentos-obra" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-obra');

CREATE POLICY "Authenticated can upload documentos-obra" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-obra');

CREATE POLICY "Authenticated can update documentos-obra" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-obra');

CREATE POLICY "Authenticated can delete documentos-obra" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-obra');
