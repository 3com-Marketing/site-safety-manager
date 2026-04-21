CREATE POLICY "Owners and admins can update fotos"
ON public.fotos
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM incidencias
    JOIN informes ON informes.id = incidencias.informe_id
    JOIN visitas ON visitas.id = informes.visita_id
    WHERE incidencias.id = fotos.incidencia_id AND visitas.usuario_id = auth.uid()
  )
);