

# Plan: Sincronizar edge function PDF con datos del formulario CAE

## Resumen

La edge function `generar-documento-pdf` usa campos y textos hardcodeados que ya no coinciden con lo que guarda el formulario. Hay que actualizar la función para que lea los nuevos campos de `datos_extra`.

## Cambios

### `supabase/functions/generar-documento-pdf/index.ts` — función `templateActaReunion`

Actualizar las secciones 1-13 del template CAE (líneas ~405-572) para leer los campos correctos de `extra`:

| Sección | Actualmente lee | Debe leer |
|---------|----------------|-----------|
| 1. Objetivo y alcance | Texto hardcodeado | `extra.texto_punto1` (con fallback al texto actual) |
| 2. Intercambio documentación | Texto hardcodeado | `extra.texto_punto2` + `extra.texto_punto2_bloque2` + checkboxes `punto2_doc_*` + `punto2_no_procede` + `punto2_otros` |
| 3. Trabajos (intro) | No existe | `extra.texto_punto3` antes de riesgos |
| 5. Acuerdos generales | `extra.texto_legal` | `extra.texto_acuerdos_generales` (con fallback a `texto_legal` por retrocompatibilidad) |
| 6. Formación | Hardcodeado o `texto_legal` | `extra.texto_punto6` |
| 7. Control maquinaria | Hardcodeado o `texto_legal` | `extra.texto_punto7` |
| 8. Protecciones colectivas | Hardcodeado o `texto_legal` | `extra.texto_punto8` |
| 9. Protecciones individuales | Hardcodeado o `texto_legal` | `extra.texto_punto9` |
| 10. Interferencias empresas | `interferencias_empresas_aplica` (boolean) | `extra.texto_punto10` + `extra.punto10_procede` (`'si_procede'`/`'no_procede'`) + `extra.punto10_texto_procede` |
| 11. Interferencias terceros | OK (sin cambios) | Sin cambios |
| 12. Medio ambiente | OK (sin cambios) | Sin cambios |
| 13. Ruegos y sugerencias | `ruegos_aplica` (boolean) | `extra.texto_punto13` + `extra.punto13_procede` + `extra.punto13_texto_procede` |

### Lógica de cada sección actualizada

- **Puntos 1, 3, 5, 6, 7, 8, 9**: Si `extra.texto_puntoN` tiene contenido, renderizar con `renderRichText()`. Si está vacío, usar el fallback hardcodeado actual.
- **Punto 2**: Renderizar `texto_punto2`, luego la tabla de empresas, luego los checkboxes dinámicos (`punto2_doc_preventiva`, etc.), luego `texto_punto2_bloque2`, plataforma CAE.
- **Puntos 10 y 13**: Renderizar texto introductorio, luego mostrar "NO PROCEDE" o "SÍ PROCEDE" con el texto del recuadro si procede. Formato visual: recuadro con borde verde si procede.

### Retrocompatibilidad

Mantener fallbacks para documentos antiguos que aún usen los campos viejos (`texto_legal`, `interferencias_empresas_aplica`, `ruegos_aplica`).

## Archivo afectado
- **`supabase/functions/generar-documento-pdf/index.ts`** — función `templateActaReunion` (líneas ~298-583)

