

# Plan: Paso 7 — Formularios específicos completos

Reescribir los 4 formularios con todos los campos especificados, pre-relleno desde `defaultValues`, y lógica condicional por subtipo.

## 1. `FormActaNombramiento.tsx` — Reescritura

**Campos nuevos** (almacenados en `datos_extra`):
- Datos proyecto: Denominación, Emplazamiento, Tipo de obra
- Selector: "CAE (obra sin proyecto)" / "Con proyecto" (radio/select)
- Lugar firma (default "Maspalomas")

**Campos existentes** que se mantienen: nombre/dni/titulación coordinador, empresa/cif/domicilio empresa, móvil, email, promotor/cif/domicilio promotor, fecha.

**Pre-relleno**: `denominacion` ← obra nombre, `emplazamiento` ← obra dirección (necesita añadir `nombre_obra` y `direccion_obra` al `defaultValues` en `NuevoDocumentoDialog`).

## 2. `FormActaAprobacion.tsx` — Reescritura

**Dos modos**: DGPO (`acta_aprobacion_dgpo`) vs Plan SYS (`acta_aprobacion_plan_sys`), detectado via `tipo` prop.

**Campos comunes** (en `datos_extra`): Actuación/Obra, Localidad y situación, Promotor, Autor del Proyecto, Coordinador SS durante Proyecto, Autor Estudio SS, Director de obra, Lugar y fecha firma.

**Solo DGPO**: Coordinadora de actividades empresariales, Empresa Contratista Titular.
**Solo Plan SYS**: Coordinador SS durante la Obra, Empresa Contratista Titular del Plan.

**Pre-relleno**: actuación ← obra nombre, localidad ← obra dirección, promotor ← cliente nombre.

## 3. `FormActaReunion.tsx` — Reescritura

**Tres modos**: CAE, Inicial, SYS — detectado via `tipo` prop.

**Campos comunes**: Obra/Título actuación, Localidad, Promotor, Lugar reunión, Fecha y hora, Tabla asistentes (dinámica), Excusados/ausentes (texto).

**Solo CAE**: Mes reunión, Tabla actividades (dinámica), Tabla empresas acceso (dinámica), Riesgos previstos (checkboxes: Atrapamiento, Arrollamiento, Caída de altura, Espacios confinados, Riesgo eléctrico, Otros), Plataforma CAE (default "metacontratas").

**Solo SYS**: Número de acta (correlativo).

**Asistentes en modo creación**: se gestionan como state local (array), se pasan en `onSave` para que `crearDocumento` los inserte. En modo edición (con `documento`), se usan las mutations del hook como ahora.

## 4. `FormInforme.tsx` — Reescritura

**Campos** (todos en `datos_extra`): Fecha visita, Título obra, Nombre técnico, 8 secciones textarea (Estado general, Orden y limpieza, Señalización, Trabajos en altura, EPC, EPI, Maquinaria, Medios auxiliares), Recomendaciones adicionales.

**Pre-relleno**: título obra ← obra nombre, nombre técnico ← técnico nombre.

**Botón "Importar desde última visita"**: Query a `visitas` → `informes` → `checklist_bloques` + `anotaciones` para la obra, agrupa por categoría y pre-rellena los textareas correspondientes. Solo visible si hay visitas para esa obra.

## 5. `NuevoDocumentoDialog.tsx` — Ampliar `defaultValues`

Añadir al mapeo:
- `nombre_obra` ← `obra.nombre`
- `direccion_obra` ← `obra.direccion`
- `nombre_tecnico` ← `tecnicoAsignado.nombre`

## Archivos afectados
- **Reescritos**: `FormActaNombramiento.tsx`, `FormActaAprobacion.tsx`, `FormActaReunion.tsx`, `FormInforme.tsx`
- **Editado**: `NuevoDocumentoDialog.tsx` (ampliar defaultValues)

## Almacenamiento de datos

Todos los campos específicos de cada formulario que no tienen columna propia en `documentos_obra` se guardan en el campo `datos_extra` (jsonb). Los campos con columna propia (`nombre_coordinador`, `dni_coordinador`, etc.) se guardan directamente.

