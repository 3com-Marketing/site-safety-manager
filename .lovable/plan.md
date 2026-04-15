

# Plan: PDF profesional para Actas de Reunión (Inicial, CAE, SyS) con previsualización editable

## Resumen

Replicar el formato de los DOCX de actas de reunión y añadir previsualización editable + texto legal modificable, igual que se hizo para informes y actas de aprobación.

## Estructura identificada en los DOCX

**Acta Reunión Inicial:**
```text
Logo centrado
"ACTA DE REUNIÓN INICIAL"
Subtítulo: Coordinación en materia de SS
Datos: Obra, Localidad, Promotor, Fecha
Tabla asistentes (Nombre, Apellidos, Cargo, Empresa, DNI/NIE, Firma)
Texto legal largo (puntos a-o sobre coordinación, acceso, EPIs, etc.)
Líneas para anotaciones adicionales
Cierre + firma doble (Empresa CSS + Coordinador/a)
```

**Acta Reunión CAE (10 páginas):**
```text
Logo + cabecera repetida (Logo | Título | Protocolo CAE | Fecha | Pág)
Título: "ACTA DE REUNIÓN DE COORDINACIÓN DE ACTIVIDADES EMPRESARIALES"
Datos: Actuación, Mes, Lugar
Tabla asistentes + Excusados/Ausentes
Orden del día (13 secciones numeradas)
Secciones: Objetivo, Documentación, Trabajos, Empresas, Riesgos, Recurso Preventivo, Acuerdos, Formación, Maquinaria, Protecciones, Interferencias, Medio Ambiente, Ruegos
Firma doble
```

**Acta Reunión SyS (Nº...):**
```text
Logo centrado
"ACTA REUNIÓN N.º X"
Datos: Obra, Localidad, Promotor, Fecha
Tabla asistentes (Empresa, Nombre, Apellido, Firma)
Texto legal (puntos 1-4 recordatorio + a-m coordinación)
Secciones: Accidentes, EPIs, Documentación, Recursos Preventivos
Cierre + firma doble
```

## Cambios

### 1. Migración BD — Textos legales por defecto para actas de reunión

Añadir a `configuracion_empresa`:
- `texto_acta_reunion_inicial` (text) — texto legal por defecto (puntos a-o)
- `texto_acta_reunion_cae` (text) — texto legal por defecto (13 secciones CAE)
- `texto_acta_reunion_sys` (text) — texto legal por defecto (puntos recordatorio + secciones)

### 2. FormActaReunion.tsx — Textarea editable para texto legal

- Añadir textarea grande "Texto legal / Contenido del acta" para los 3 tipos
- Precargada desde `configuracion_empresa` (campo correspondiente al tipo) al crear documento nuevo
- Almacenada en `datos_extra.texto_legal`
- Editable por el usuario antes de guardar

### 3. Edge function — Reescribir `templateActaReunion()`

Rehacer la plantilla para replicar el formato DOCX por tipo:

- **Inicial**: Logo centrado, título, datos de la reunión, tabla asistentes con columnas (Nombre/Apellidos/Cargo/Empresa, DNI/NIE, Firma), texto legal completo, cierre y firma
- **CAE**: Cabecera con protocolo CAE en cada página (via CSS), tabla asistentes, excusados, empresas, actividades, riesgos, texto legal con las 13 secciones, firma
- **SyS**: Logo, "ACTA REUNIÓN N.º X", datos, tabla asistentes (Empresa/Nombre/Apellido/Firma), texto legal con secciones numeradas, firma

### 4. AdminDocumentoDetalle.tsx — Redirigir a preview

Ampliar `usesPreview` para incluir los 3 tipos de acta de reunión: `acta_reunion_cae`, `acta_reunion_inicial`, `acta_reunion_sys`.

### 5. AdminConfiguracion.tsx — Textos legales de actas de reunión

Añadir tres textareas nuevas en la sección "Textos Legales por Defecto":
- "Texto Acta Reunión Inicial"
- "Texto Acta Reunión CAE"
- "Texto Acta Reunión SyS"

## Archivos afectados
- **Migración**: 3 columnas nuevas en `configuracion_empresa`
- **Editado**: `src/components/documentos/formularios/FormActaReunion.tsx` (textarea texto legal)
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (reescribir `templateActaReunion`)
- **Editado**: `src/pages/AdminDocumentoDetalle.tsx` (ampliar `usesPreview`)
- **Editado**: `src/pages/AdminConfiguracion.tsx` (3 textareas nuevas)

