

# Plan: Añadir Punto 5 — Acuerdos Generales (texto configurable)

## Resumen

Crear la sección "5. Acuerdos Generales" en el Acta Reunión CAE con texto legal editable desde Configuración, igual que el Punto 4.

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_acuerdos_generales text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_acuerdos_generales` a la interfaz `ConfigEmpresa` y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir un RichTextEditor etiquetado **"Punto 5 — Acuerdos Generales"** para `texto_acuerdos_generales`.

### 3. `FormActaReunion.tsx`

- Añadir estado `textoAcuerdosGenerales`.
- En el `useEffect` que carga configuración, cargar `texto_acuerdos_generales` como valor inicial (solo si documento nuevo y campo vacío).
- Añadir una `SectionCollapsible` "5 — Acuerdos Generales" después del Punto 4, con un RichTextEditor para `textoAcuerdosGenerales`.
- Guardar/cargar en `datos_extra` como `texto_acuerdos_generales`.

## Archivos afectados
- **Migración SQL**: nueva columna `texto_acuerdos_generales`
- **`src/pages/AdminConfiguracion.tsx`** — nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — nueva sección Punto 5

