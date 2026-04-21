

# Plan: Añadir Punto 2 — Intercambio de documentación al Acta CAE

## Resumen

Crear la sección "2. Intercambio de documentación" con texto legal editable en Configuración y sección ampliada en el formulario del dashboard. La tabla de empresas que ya existe se reubica dentro de este punto 2.

## Cambios

### 1. Migración SQL

Añadir columna `texto_cae_punto2` a `configuracion_empresa` para el texto legal fijo del punto 2:

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto2 text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`

Dentro del acordeón "Acta Reunión CAE", añadir un segundo RichTextEditor etiquetado "Punto 2 — Intercambio de documentación" para `texto_cae_punto2`. Actualizar la interfaz `ConfigEmpresa` y `EMPTY_CONFIG`.

### 3. `FormActaReunion.tsx`

- Crear nueva `SectionCollapsible` titulada **"2. Intercambio de documentación"** entre el Punto 1 y el 3.1 actual.
- Contenido de la sección:
  1. **Texto legal precargado** desde `texto_cae_punto2` de configuración, editable con RichTextEditor (por si ajustan para esta acta concreta).
  2. **Tabla de empresas** (EMPRESA / PERSONA DE CONTACTO / EMAIL DE REFERENCIA) — mover aquí la tabla que ya existe fuera de las secciones (líneas 388-410). Eliminarla de su posición actual.
  3. **Checkboxes de documentación requerida**:
     - "La documentación completa en materia preventiva y administrativa de Empresa y Trabajadores"
     - "La relación nominal completa de trabajadores (Nombre, Apellidos, N.I.F. ó Pasaporte o N.I.E.)"
     - "La relación completa de maquinaria, medios auxiliares y/o productos químicos, si procede"
     - "La relación de los trabajos a realizar (tipología o zona de afectación)"
  4. **Checkbox "No procede"** y campo **"Otros"** (texto libre)

- Nuevos estados:
  - `textoPunto2` (string) — texto legal del punto 2
  - `docChecks` (objeto con 4 booleans) — checkboxes de documentación
  - `punto2NoProcede` (boolean) — "No procede"
  - `punto2Otros` (string) — campo "Otros"

- Cargar `texto_cae_punto2` desde configuración al crear documento nuevo (mismo useEffect que ya carga `texto_cae_punto1`).
- Guardar todo en `datos_extra`.

### 4. Datos guardados en `datos_extra`

```json
{
  "texto_punto2": "...",
  "punto2_doc_preventiva": true,
  "punto2_doc_trabajadores": true,
  "punto2_doc_maquinaria": false,
  "punto2_doc_trabajos": true,
  "punto2_no_procede": false,
  "punto2_otros": ""
}
```

## Archivos afectados

- **Migración SQL**: nueva columna `texto_cae_punto2` en `configuracion_empresa`
- **`src/pages/AdminConfiguracion.tsx`** — nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — nueva sección Punto 2, reubicar tabla empresas

