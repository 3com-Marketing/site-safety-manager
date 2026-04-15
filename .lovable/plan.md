

# Plan: PDF profesional con previsualización editable (solo Informes CSS y AT)

## Alcance

Aplica **exclusivamente** a los tipos `informe_css` e `informe_at`. El resto de documentos (actas de nombramiento, aprobación, reunión) siguen funcionando con su plantilla actual sin cambios.

## Estructura del documento (extraída de los DOCX)

```text
PORTADA
  - Logo empresa (centrado)
  - "SEGURIDAD Y SALUD LABORAL"
  - Empresa contratista (solo AT)
  - Tipo: "INFORME COORDINACIÓN DE SS" o "INFORME ASISTENCIA TÉCNICA DE SS"
  - Nombre de la obra
  - Fecha (semana del...)

CABECERA (todas las páginas interiores)
  - Logo | Tipo informe | Fecha
  - Nombre obra | CSS/Técnico PRL nombre

CONTENIDO NUMERADO
  1. Índice
  2. Recomendaciones (texto legal editable)
  3. Estado general de la obra
  4. Orden y limpieza
  5. Señalización y balizamiento
  6. Trabajos en altura
  7. Equipos de protección colectiva
  8. Equipos de protección individual
  9. Maquinaria
  10. Medios auxiliares
  11. Normativa aplicable (texto legal editable)

PIE: Nombre de la obra + nº página
```

## Cambios

### 1. Migración BD -- Textos legales por defecto

Añadir a `configuracion_empresa`:
- `texto_recomendaciones` (text, default con el texto estándar de los DOCX)
- `texto_normativa` (text, default con la lista de leyes de los DOCX)

### 2. FormInforme.tsx -- Nuevos campos

- Campo "Empresa contratista" (visible solo si tipo es `informe_at`)
- Textarea "Recomendaciones" grande, precargada desde `configuracion_empresa.texto_recomendaciones` al crear documento nuevo (almacenada en `datos_extra.recomendaciones`)
- Textarea "Normativa aplicable" grande, precargada desde `configuracion_empresa.texto_normativa` al crear documento nuevo (almacenada en `datos_extra.normativa`)
- Ambos textos editables por el usuario antes de guardar

### 3. Edge function -- Reescribir solo `templateInforme()`

Rehacer la función `templateInforme()` en `generar-documento-pdf/index.ts` para replicar el formato DOCX:
- Portada con logo centrado, empresa contratista (AT), tipo, nombre obra, fecha
- Cabecera repetida en cada pagina via CSS `@page` con `position: running()`
- Secciones numeradas 1-11
- Texto de recomendaciones con formato HTML (bullets, sub-bullets, negritas, subrayados)
- Texto de normativa con formato de lista
- Pie con nombre obra + numero pagina
- Las demás plantillas (`templateActaNombramiento`, `templateActaAprobacion`, `templateActaReunion`) no se tocan

### 4. Nueva pagina de previsualización -- `AdminDocumentoPreview.tsx`

- Ruta: `/admin/documentos/:id/preview`
- Al pulsar "Generar PDF" en un informe CSS/AT, navega a esta pagina en vez de abrir ventana de impresion
- Llama a la edge function, recibe el HTML
- Muestra el HTML en un contenedor `contentEditable` donde el usuario puede modificar textos
- Boton "Imprimir" para lanzar `window.print()` con el contenido editado
- Boton "Volver" para regresar al formulario
- Para otros tipos de documento, el flujo actual (ventana de impresion directa) se mantiene

### 5. AdminConfiguracion.tsx -- Textos legales

Nueva tarjeta "Textos legales por defecto" con:
- Textarea para "Recomendaciones"
- Textarea para "Normativa aplicable"

### 6. Routing

- Añadir ruta `/admin/documentos/:id/preview` en `App.tsx`
- Modificar `AdminDocumentoDetalle.tsx`: si el documento es `informe_css` o `informe_at`, el boton "Generar PDF" navega a la preview; para otros tipos, mantiene el comportamiento actual

## Archivos afectados
- **Migración**: 2 columnas nuevas en `configuracion_empresa`
- **Nuevo**: `src/pages/AdminDocumentoPreview.tsx`
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (solo `templateInforme`)
- **Editado**: `src/components/documentos/formularios/FormInforme.tsx`
- **Editado**: `src/pages/AdminConfiguracion.tsx`
- **Editado**: `src/pages/AdminDocumentoDetalle.tsx`
- **Editado**: `src/App.tsx`

