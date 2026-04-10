
-- Checklist block states per informe
CREATE TABLE public.checklist_bloques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  informe_id UUID NOT NULL REFERENCES public.informes(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(informe_id, categoria)
);

ALTER TABLE public.checklist_bloques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view checklist_bloques"
ON public.checklist_bloques FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Owners and admins can insert checklist_bloques"
ON public.checklist_bloques FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM informes JOIN visitas ON visitas.id = informes.visita_id
    WHERE informes.id = checklist_bloques.informe_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can update checklist_bloques"
ON public.checklist_bloques FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM informes JOIN visitas ON visitas.id = informes.visita_id
    WHERE informes.id = checklist_bloques.informe_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can delete checklist_bloques"
ON public.checklist_bloques FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM informes JOIN visitas ON visitas.id = informes.visita_id
    WHERE informes.id = checklist_bloques.informe_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Annotations within checklist blocks
CREATE TABLE public.anotaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bloque_id UUID NOT NULL REFERENCES public.checklist_bloques(id) ON DELETE CASCADE,
  texto TEXT NOT NULL DEFAULT '',
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anotaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view anotaciones"
ON public.anotaciones FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Owners and admins can insert anotaciones"
ON public.anotaciones FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM checklist_bloques
    JOIN informes ON informes.id = checklist_bloques.informe_id
    JOIN visitas ON visitas.id = informes.visita_id
    WHERE checklist_bloques.id = anotaciones.bloque_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can update anotaciones"
ON public.anotaciones FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM checklist_bloques
    JOIN informes ON informes.id = checklist_bloques.informe_id
    JOIN visitas ON visitas.id = informes.visita_id
    WHERE checklist_bloques.id = anotaciones.bloque_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Owners and admins can delete anotaciones"
ON public.anotaciones FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM checklist_bloques
    JOIN informes ON informes.id = checklist_bloques.informe_id
    JOIN visitas ON visitas.id = informes.visita_id
    WHERE checklist_bloques.id = anotaciones.bloque_id AND visitas.usuario_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);
