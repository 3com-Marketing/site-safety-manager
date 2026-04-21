

# Plan: Rehacer Punto 2 — Intercambio de documentación (primera iteración)

## Problema

El Punto 2 actual tiene checkboxes y campos que no corresponden con el documento real. Según la imagen, el Punto 2 empieza con un texto legal fijo ("Las empresas se comprometen a: ...") seguido de la tabla de empresas (EMPRESA / PERSONA DE CONTACTO / EMAIL DE REFERENCIA). Nada más por ahora.

## Cambio

**Archivo**: `src/components/documentos/formularios/FormActaReunion.tsx`

1. Reemplazar todo el contenido de la `SectionCollapsible` "2. Intercambio de documentación" (líneas 470-531) por:
   - **Texto legal editable** cargado desde `texto_cae_punto2` de configuración (RichTextEditor, igual que el punto 1).
   - **Tabla de empresas** con columnas EMPRESA / PERSONA DE CONTACTO / EMAIL DE REFERENCIA (la misma que ya está, se mantiene).

2. **Eliminar** los estados y lógica de `docChecks`, `punto2NoProcede`, `punto2Otros` y sus referencias en el guardado (`datos_extra`). Ya no se usan.

3. Se mantienen: `textoPunto2`, la tabla de empresas y su lógica existente.

El texto por defecto para configuración sería algo como: "Las empresas se comprometen a: Cada empresa certifica juradamente que su personal, maquinaria... Cada empresa que desee acceder al Centro de Trabajo debe comunicar a:". Esto se pone en Configuración, no hardcodeado.

## Archivos afectados
- `src/components/documentos/formularios/FormActaReunion.tsx` — simplificar Punto 2, eliminar checkboxes y campos sobrantes

