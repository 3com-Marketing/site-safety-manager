

# Plan: Rediseñar Punto 10 — Interferencias entre empresas

## Resumen

Cambiar el Punto 10 para que tenga: un texto legal configurable desde Configuración, dos opciones "No Procede" / "Sí Procede", y si procede, mostrar un campo de texto editable con las medidas a aplicar.

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto10 text NOT NULL DEFAULT '',
ADD COLUMN texto_cae_punto10_procede text NOT NULL DEFAULT '';
```

- `texto_cae_punto10`: texto legal introductorio (el párrafo sobre el RD 171/2004).
- `texto_cae_punto10_procede`: texto por defecto que aparece en el recuadro cuando "Sí Procede" (las medidas: "PARA EVITAR EN MAYOR MEDIDA LOS RIESGOS...").

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_cae_punto10` y `texto_cae_punto10_procede` a la interfaz y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir 2 RichTextEditors:
  - **"Punto 10 — Interferencias entre empresas (texto legal)"**
  - **"Punto 10 — Texto cuando SI procede"**

### 3. `FormActaReunion.tsx`

- Reemplazar los estados actuales `interferenciasEmpresasAplica` (boolean) e `interferenciasEmpresasTexto` por:
  - `textoPunto10`: texto legal (precargado desde configuración).
  - `punto10Procede`: `'no_procede' | 'si_procede'` (por defecto `'no_procede'`).
  - `punto10TextoProcede`: texto editable del recuadro (precargado desde configuración si procede).
- En el `useEffect` de configuración, cargar `texto_cae_punto10` y `texto_cae_punto10_procede`.
- En el `useEffect` de documento existente, leer de `datos_extra`.
- Rediseñar la sección 10:
  1. RichTextEditor con el texto legal introductorio.
  2. Dos botones/radio: "NO PROCEDE" / "SÍ PROCEDE".
  3. Si "Sí Procede", mostrar un RichTextEditor con fondo verde claro para las medidas.
- Guardar en `datos_extra` como `texto_punto10`, `punto10_procede`, `punto10_texto_procede`.

## Archivos afectados
- **Migración SQL**: 2 nuevas columnas
- **`src/pages/AdminConfiguracion.tsx`** — 2 nuevos editores en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — rediseño de la sección 10

