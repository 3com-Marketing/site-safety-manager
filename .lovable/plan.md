

# Plan: PDF profesional para Actas de Aprobación (DGPO y Plan SyS) con previsualización editable

## Resumen

Replicar el formato exacto de los DOCX de actas de aprobación (logo, tabla de datos, texto legal editable, firma) y añadir previsualización editable antes de imprimir, igual que se hizo para los informes CSS/AT.

## Estructura identificada en los DOCX

```text
┌───────────────────────────────────┐
│ Logo empresa (centrado)           │
│ "ACTA DE APROBACIÓN DEL PLAN     │
│  DE SEGURIDAD Y SALUD" / "DGPO"  │
├───────────────────────────────────┤
│ TABLA de campos:                  │
│  Obra/Instalación | valor         │
│  Localidad        | valor         │
│  Promotor         | valor + CIF   │
│  Autor Proyecto   | valor         │
│  Coord SS Proy    | valor         │
│  Autor Estudio SS | valor         │
│  Director obra    | valor         │
│  Coord SS Obra (SyS) /            │
│  Coord Act.Empr. (DGPO) | valor  │
│  Empresa Contratista     | valor  │
├───────────────────────────────────┤
│ TEXTO LEGAL (3 párrafos)          │
│  - Diferente para DGPO vs SyS    │
│  - Editable por el usuario        │
├───────────────────────────────────┤
│ En [lugar], a [fecha]             │
│ Firma: La Coordinadora de SS /    │
│        La Coordinadora CAE        │
└───────────────────────────────────┘
```

## Cambios

### 1. Migración BD — Textos legales por defecto para actas

Añadir a `configuracion_empresa`:
- `texto_acta_aprobacion_sys` (text) — texto legal por defecto del acta Plan SyS
- `texto_acta_aprobacion_dgpo` (text) — texto legal por defecto del acta DGPO

Ambos con el contenido extraído de los DOCX como valor por defecto.

### 2. FormActaAprobacion.tsx — Textarea editable para texto legal

- Añadir textarea grande "Texto legal" precargada desde `configuracion_empresa` al crear documento nuevo, y desde `datos_extra.texto_legal` si ya existe
- El texto se guarda en `datos_extra.texto_legal`
- Al crear un documento nuevo, se precarga el texto correspondiente (SyS o DGPO) desde la configuración de empresa

### 3. Edge function — Reescribir `templateActaAprobacion()`

Rehacer la plantilla para replicar el formato DOCX:
- Logo centrado arriba
- Título "ACTA DE APROBACIÓN DEL PLAN DE SEGURIDAD Y SALUD" o "ACTA DE APROBACIÓN DGPO (Documento de Gestión Preventiva de la Obra)"
- Tabla con los campos (etiqueta | valor) en formato similar al DOCX
- Texto legal completo (3 párrafos)
- Lugar y fecha
- Bloque de firma

### 4. AdminDocumentoDetalle.tsx — Redirigir a preview

Ampliar la lógica de `handleGeneratePdf` para que las actas de aprobación (`acta_aprobacion_dgpo`, `acta_aprobacion_plan_sys`) también naveguen a la página de previsualización editable, igual que los informes.

### 5. AdminConfiguracion.tsx — Textos legales de actas

Añadir dos textareas nuevas en la sección "Textos Legales por Defecto":
- "Texto Acta Aprobación Plan SyS"
- "Texto Acta Aprobación DGPO"

## Archivos afectados
- **Migración**: 2 columnas nuevas en `configuracion_empresa`
- **Editado**: `src/components/documentos/formularios/FormActaAprobacion.tsx` (textarea texto legal)
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (reescribir `templateActaAprobacion`)
- **Editado**: `src/pages/AdminDocumentoDetalle.tsx` (redirigir a preview)
- **Editado**: `src/pages/AdminConfiguracion.tsx` (textareas textos legales actas)

