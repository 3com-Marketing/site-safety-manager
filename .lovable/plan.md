

# Plan: Añadir Puntos 6, 7, 8 y 9 — Texto configurable (igual que 4 y 5)

## Resumen

Crear las secciones 6 (Formación e Información), 7 (Control de maquinaria), 8 (Protecciones Colectivas y Medios Auxiliares) y 9 (Protecciones Individuales) en el Acta Reunión CAE, con texto legal editable desde Configuración.

## Cambios

### 1. Migración SQL

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto6 text NOT NULL DEFAULT '',
ADD COLUMN texto_cae_punto7 text NOT NULL DEFAULT '',
ADD COLUMN texto_cae_punto8 text NOT NULL DEFAULT '',
ADD COLUMN texto_cae_punto9 text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`

- Añadir `texto_cae_punto6`, `texto_cae_punto7`, `texto_cae_punto8`, `texto_cae_punto9` a la interfaz `ConfigEmpresa` y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir 4 RichTextEditors:
  - **"Punto 6 — Formación e Información"**
  - **"Punto 7 — Control de maquinaria"**
  - **"Punto 8 — Protecciones Colectivas y Medios Auxiliares"**
  - **"Punto 9 — Protecciones Individuales"**

### 3. `FormActaReunion.tsx`

- Añadir 4 estados: `textoPunto6`, `textoPunto7`, `textoPunto8`, `textoPunto9`.
- En el `useEffect` de configuración, cargar los 4 campos desde `configuracion_empresa` para documentos nuevos.
- En el `useEffect` de carga de documento existente, leer de `datos_extra`.
- Añadir 4 `SectionCollapsible` después del Punto 5 y antes del Punto 10, cada una con un RichTextEditor.
- Guardar en `datos_extra` como `texto_punto6`, `texto_punto7`, `texto_punto8`, `texto_punto9`.

## Archivos afectados
- **Migración SQL**: 4 nuevas columnas
- **`src/pages/AdminConfiguracion.tsx`** — 4 nuevos editores en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — 4 nuevas secciones colapsables

