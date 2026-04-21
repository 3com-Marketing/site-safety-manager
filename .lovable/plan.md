

# Plan: Reestructurar Punto 3 — Trabajos Realizados y Previstos

## Resumen

Mover la sección de "Riesgos previstos" (checkboxes + otros riesgos) dentro del Punto 3, añadir un texto legal configurable desde Configuración, y agrupar todo (texto introductorio, riesgos, 3.1, 3.2, 3.3) dentro de una única sección colapsable "3 — Trabajos Realizados y Previstos".

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto3 text NOT NULL DEFAULT '';
```

- `texto_cae_punto3`: texto introductorio del punto 3 ("Los trabajos planificados a continuación son tratados desde el punto de vista del RD 171/04...").

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_cae_punto3` a la interfaz `ConfigEmpresa` y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir un RichTextEditor:
  - **"Punto 3 — Trabajos Realizados y Previstos (texto introductorio)"**

### 3. `FormActaReunion.tsx`

- Añadir estado `textoPunto3` (string).
- En el `useEffect` de configuración, cargar `texto_cae_punto3`.
- En el `useEffect` de documento existente, leer `texto_punto3` de `datos_extra`.
- Guardar en `datos_extra` como `texto_punto3`.
- **Eliminar** la sección standalone de "Riesgos previstos" (líneas ~449-470) que está fuera de las secciones numeradas.
- **Crear** una nueva `SectionCollapsible` "3 — Trabajos Realizados y Previstos" que contenga (en orden):
  1. RichTextEditor con el texto introductorio.
  2. Los checkboxes de riesgos previstos (Atrapamiento, Arrollamiento, etc.) + campo "Otros riesgos".
  3. Subsección 3.1 — Empresas que intervienen (el contenido actual de la sección 3.1).
  4. Subsección 3.2 — Duración y ubicación de los trabajos (contenido actual).
  5. Subsección 3.3 — Trabajos a realizar (contenido actual).
- Las subsecciones 3.1, 3.2, 3.3 pueden ser `SectionCollapsible` anidadas o simplemente separadores con título dentro del punto 3.

## Archivos afectados
- **Migración SQL**: 1 nueva columna `texto_cae_punto3`
- **`src/pages/AdminConfiguracion.tsx`** — 1 nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — reestructuración del punto 3

