1. Actualizar el formulario del punto 11
- Cambiar el control actual de “¿Se detectan interferencias con terceros?” (checkbox único) por una selección explícita “NO” / “SÍ”, siguiendo el patrón visual ya usado en los puntos 10 y 13.
- Mostrar el cuadro de texto de explicación para la opción seleccionada, de modo que siempre se pueda guardar el motivo de lo que proceda.

2. Ajustar el modelo de datos con compatibilidad retroactiva
- Añadir al tipado del documento campos específicos para el punto 11 con un valor tipo `no_procede | si_procede` y su texto asociado.
- Mantener compatibilidad con documentos antiguos que aún tengan el formato booleano (`interferencias_terceros_aplica`) para no romper actas ya guardadas.
- Al cargar un documento antiguo, traducir el booleano al nuevo formato para que el formulario siga funcionando correctamente.

3. Corregir la generación del PDF del punto 11
- Modificar la plantilla PDF para que el punto 11 siempre pinte ambos checklist visibles:
  - `☑ NO` / `☐ SÍ` cuando no procede
  - `☐ NO` / `☑ SÍ` cuando sí procede
- Debajo, mostrar el texto justificativo correspondiente a la opción elegida, igual que en el ejemplo que has adjuntado.
- Mantener compatibilidad con el formato antiguo para que si se abre un documento previo también salga correctamente en el PDF.

4. Validación final
- Verificar que el punto 11 se ve en el PDF con ambos checks visibles y con el motivo correcto tanto para “sí” como para “no”.
- Confirmar que los puntos 10 y 13 no se ven afectados por este ajuste.

Detalles técnicos
- Archivos previsibles a tocar:
  - `src/components/documentos/formularios/FormActaReunion.tsx`
  - `src/types/documentos.ts`
  - `supabase/functions/generar-documento-pdf/index.ts`
- No hace falta cambiar tablas de base de datos porque estos valores viven en los datos extra del documento.