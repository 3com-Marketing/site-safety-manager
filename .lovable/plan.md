

# Plan: Rediseñar Punto 13 — Ruegos y sugerencias (igual que Punto 10)

## Resumen

Cambiar el Punto 13 para que tenga: un texto legal configurable, selección "No Procede" / "Sí Procede", y si procede, un texto editable con las medidas. Mismo patrón que el Punto 10.

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto13 text NOT NULL DEFAULT '',
ADD COLUMN texto_cae_punto13_procede text NOT NULL DEFAULT '';
```

- `texto_cae_punto13`: texto introductorio ("Los asistentes comunican su total intención...").
- `texto_cae_punto13_procede`: texto por defecto del recuadro cuando procede ("Se les recuerda en cada visita semanal...").

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_cae_punto13` y `texto_cae_punto13_procede` a la interfaz y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir 2 RichTextEditors:
  - **"Punto 13 — Ruegos y sugerencias (texto introductorio)"**
  - **"Punto 13 — Texto cuando SI procede"**

### 3. `FormActaReunion.tsx`

- Reemplazar `ruegosAplica` (boolean) y `ruegosTexto` por:
  - `textoPunto13`: texto introductorio (precargado desde configuración).
  - `punto13Procede`: `'no_procede' | 'si_procede'` (por defecto `'no_procede'`).
  - `punto13TextoProcede`: texto editable del recuadro (precargado desde configuración).
- En el `useEffect` de configuración, cargar `texto_cae_punto13` y `texto_cae_punto13_procede`.
- En el `useEffect` de documento existente, leer de `datos_extra`.
- Rediseñar la sección 13:
  1. RichTextEditor con el texto introductorio.
  2. Dos botones: "NO PROCEDE" / "SÍ PROCEDE".
  3. Si "Sí Procede", mostrar un RichTextEditor con fondo verde claro para las indicaciones.
- Guardar en `datos_extra` como `texto_punto13`, `punto13_procede`, `punto13_texto_procede`.

## Archivos afectados
- **Migración SQL**: 2 nuevas columnas
- **`src/pages/AdminConfiguracion.tsx`** — 2 nuevos editores en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — rediseño de la sección 13

