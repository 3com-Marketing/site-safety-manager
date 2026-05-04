
## Objetivo

En el punto **12 — Medio Ambiente** del Acta Reunión CAE, replicar exactamente la misma lógica que ya tiene el punto 11 (Interferencias con TERCEROS):

- Selector **NO / SÍ** con botones (en vez del checkbox actual "¿Aplica?").
- Editor de texto enriquecido para el caso **SÍ** (medidas a aplicar para eliminar los riesgos medioambientales).
- Editor de texto enriquecido para el caso **NO** con un texto justificativo por defecto.
- En el PDF, mostrar el checklist `☐ NO PROCEDE` (gris) / `☑ SÍ PROCEDE` (verde) y el bloque de justificación correspondiente, idéntico al estilo de los puntos 11 y 13.
- Mantener retrocompatibilidad con los documentos existentes que usan `medio_ambiente_aplica` + `medio_ambiente_texto`.

## Cambios

### 1. `src/types/documentos.ts`
Añadir al tipo `DatosExtraActaReunion`:
- `punto12_procede?: 'no_procede' | 'si_procede'`
- `punto12_texto_procede?: string`
- `punto12_texto_no_procede?: string`

Mantener los campos `medio_ambiente_aplica` y `medio_ambiente_texto` como legacy.

### 2. `src/components/documentos/formularios/FormActaReunion.tsx`
- Añadir estados: `punto12Procede`, `punto12TextoProcede`, `punto12TextoNoProcede` con un texto por defecto del tipo: "No se detectan aspectos medioambientales relevantes en las actuaciones objeto de esta reunión."
- En la carga del documento, mapear desde los campos legacy igual que se hace en el punto 11.
- En el guardado, escribir los tres nuevos campos en `datos_extra`.
- Sustituir el bloque actual del punto 12 (checkbox + Textarea) por el mismo patrón visual que el punto 11: botones NO/SÍ + `RichTextEditor` para SÍ (caja verde) o para NO (caja gris).

### 3. `supabase/functions/generar-documento-pdf/index.ts`
Reemplazar el bloque actual del punto 12 por la misma estructura que el punto 13:

- Resolver `p12Procede` desde `extra.punto12_procede` o, si no existe, desde el legacy `extra.medio_ambiente_aplica`.
- Resolver `textoSi12` y `textoNo12` priorizando los nuevos campos y cayendo al texto legacy / texto por defecto.
- Renderizar el checklist:
  ```
  ☐ NO PROCEDE   ☑ SÍ PROCEDE
  ```
  con `#666` para NO y `#16a34a` para SÍ.
- Si `si_procede` y hay texto: caja verde (`border:2px solid #16a34a; background:#f0fdf4`) con el texto.
- Si `no_procede`: mostrar el texto justificativo en bloque normal.

### 4. Redeploy
Redeplegar la edge function `generar-documento-pdf`.

## Notas

- El texto por defecto para "NO" del punto 12 debe ser específico de medio ambiente (no copiar el de terceros).
- No se modifica nada en los puntos 10, 11 ni 13.
