## Objetivo

Eliminar del PDF del Acta Reunión CAE el bloque "Documentación a entregar por cada empresa" (la tabla con los checkboxes de Documentación preventiva, TC2/RNT, Seguro RC, EPIs, Recurso Preventivo, etc.).

## Cambio a realizar

**Archivo:** `supabase/functions/generar-documento-pdf/index.ts` (líneas 505–554)

Eliminar por completo el bloque que:
1. Pinta el título `Documentación a entregar por cada empresa:`
2. Define el array `docCheckboxKeys`
3. Renderiza la tabla dinámica (rama `hasDynamicChecks`)
4. Renderiza la tabla fija de fallback con los 10 documentos

El resto del Punto 2 (texto introductorio, tabla de empresas, y `texto_punto2_bloque2`) se mantiene intacto.

## Notas

- No hay campos en el formulario `FormActaReunion.tsx` para estos checkboxes (siempre se mostraba el fallback fijo), así que no hay que tocar el formulario ni la configuración.
- No se modifica la base de datos.
