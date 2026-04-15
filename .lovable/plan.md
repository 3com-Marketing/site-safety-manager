

# Plan: PDF profesional para Actas de Nombramiento (CAE y Con Proyecto) con previsualización editable

## Resumen

Aplicar el mismo tratamiento que informes, actas de aprobación y actas de reunión: reescribir la plantilla para replicar el formato DOCX, añadir texto legal editable, y redirigir a la previsualización editable.

## Estructura identificada en los DOCX

**CAE (obra sin proyecto):**
```text
Logo centrado
"ACTA DE NOMBRAMIENTO"
Subtítulo: COORDINACIÓN DE ACTIVIDADES EMPRESARIALES (CAE)
Secciones: Datos del Proyecto, Datos del Promotor, Datos del Coordinador/a CAE
Texto legal: "Conforme al RD 171/2004..." (1 párrafo)
Lugar y fecha
Firma doble: Promotor | Coordinadora CAE
```

**Con Proyecto:**
```text
Logo centrado
"ACTA DE NOMBRAMIENTO"
Subtítulo: COORDINACIÓN EN MATERIA DE SEGURIDAD Y SALUD EN FASE DE EJECUCIÓN
Secciones: Datos del Proyecto, Datos del Promotor, Datos de la Coordinadora
Texto legal: "De una parte..." + "Conforme al Artículo 3.1 de RD 1627/1997..." (2 párrafos)
Lugar y fecha
Firma doble: Promotor | Coordinadora de SS en fase de ejecución
```

## Cambios

### 1. Migración BD — Textos legales por defecto

Añadir a `configuracion_empresa`:
- `texto_acta_nombramiento_cae` (text) — texto legal RD 171/2004
- `texto_acta_nombramiento_proyecto` (text) — texto legal RD 1627/1997

### 2. FormActaNombramiento.tsx — Textarea editable para texto legal

- Añadir textarea "Texto legal" precargada desde `configuracion_empresa` según modalidad (cae/proyecto)
- Almacenada en `datos_extra.texto_legal`
- Editable por el usuario antes de guardar

### 3. Edge function — Reescribir `templateActaNombramiento()`

Rehacer la plantilla para replicar el formato DOCX:
- Logo centrado
- Título y subtítulo diferenciado por modalidad
- Datos en tabla con etiqueta|valor (como en actas de aprobación)
- Texto legal completo desde `datos_extra.texto_legal`
- Lugar, fecha y firma doble con etiquetas correctas por modalidad

### 4. AdminDocumentoDetalle.tsx — Redirigir a preview

Añadir actas de nombramiento a `usesPreview`:
```
const isActaNombramiento = documento?.tipo === 'acta_nombramiento_cae' || documento?.tipo === 'acta_nombramiento_proyecto';
const usesPreview = isInforme || isActaAprobacion || isActaReunion || isActaNombramiento;
```

### 5. AdminConfiguracion.tsx — Textos legales

Añadir dos textareas nuevas en "Textos Legales por Defecto":
- "Texto Acta Nombramiento CAE"
- "Texto Acta Nombramiento Con Proyecto"

## Archivos afectados
- **Migración**: 2 columnas nuevas en `configuracion_empresa`
- **Editado**: `src/components/documentos/formularios/FormActaNombramiento.tsx` (textarea texto legal)
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (reescribir `templateActaNombramiento`)
- **Editado**: `src/pages/AdminDocumentoDetalle.tsx` (ampliar `usesPreview`)
- **Editado**: `src/pages/AdminConfiguracion.tsx` (2 textareas nuevas)

