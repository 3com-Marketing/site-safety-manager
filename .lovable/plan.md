

# Plan: Añadir texto configurable para Punto 4 — Recurso Preventivo

## Resumen

Crear una columna en configuración para el texto legal del Punto 4 (Recurso Preventivo) y precargarlo en el formulario del Acta Reunión CAE, igual que se hace con los puntos 1 y 2.

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_recurso_preventivo text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_recurso_preventivo` a la interfaz `ConfigEmpresa` y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir un RichTextEditor etiquetado **"Punto 4 — Recurso preventivo"** para `texto_recurso_preventivo`.

### 3. `FormActaReunion.tsx`

- En el `useEffect` que carga configuración para documentos nuevos, cargar `texto_recurso_preventivo` desde configuración y usarlo como valor inicial de `textoRecursoPreventivo` (solo si el documento es nuevo y el campo está vacío).

## Archivos afectados
- **Migración SQL**: nueva columna `texto_recurso_preventivo`
- **`src/pages/AdminConfiguracion.tsx`** — nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — precargar texto desde configuración

