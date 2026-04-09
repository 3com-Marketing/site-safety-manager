
-- Fix informes INSERT policy
DROP POLICY "Authenticated can create informes" ON public.informes;
CREATE POLICY "Owners can create informes" ON public.informes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.visitas WHERE visitas.id = visita_id AND visitas.usuario_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix incidencias INSERT policy
DROP POLICY "Authenticated can create incidencias" ON public.incidencias;
CREATE POLICY "Owners can create incidencias" ON public.incidencias FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.informes
    JOIN public.visitas ON visitas.id = informes.visita_id
    WHERE informes.id = informe_id AND visitas.usuario_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix fotos INSERT policy
DROP POLICY "Authenticated can create fotos" ON public.fotos;
CREATE POLICY "Owners can create fotos" ON public.fotos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.incidencias
    JOIN public.informes ON informes.id = incidencias.informe_id
    JOIN public.visitas ON visitas.id = informes.visita_id
    WHERE incidencias.id = incidencia_id AND visitas.usuario_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);
