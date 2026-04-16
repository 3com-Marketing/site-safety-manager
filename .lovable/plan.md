

# Plan: Texto fijo del Punto 1 en Configuración + tabla actividades en el formulario

## Resumen

Añadir un campo específico en Configuración para el texto legal del Punto 1 del Acta Reunión CAE ("En cumplimiento del RD 171/2004..."), y en el formulario del documento mostrar ese texto seguido de la tabla de actividades que ya existe.

## Cambios

### 1. Migración SQL
Añadir columna `texto_cae_punto1` a `configuracion_empresa` para guardar el texto fijo del punto 1:

```sql
ALTER TABLE configuracion_empresa
ADD COLUMN texto_cae_punto1 text NOT NULL DEFAULT '';
```

### 2. `AdminConfiguracion.tsx`
Dentro del acordeón "Acta Reunión CAE", añadir un campo RichTextEditor etiquetado "Punto 1 — Objetivo, alcance y ámbito de actuación" para `texto_cae_punto1`. El campo `texto_acta_reunion_cae` existente se mantiene para el resto del texto legal general.

### 3. `FormActaReunion.tsx`
En la sección CAE del formulario, crear un bloque colapsable "1. Objetivo, alcance y ámbito de actuación" que:
- Cargue y muestre el texto fijo desde configuración (`texto_cae_punto1`) como RichTextEditor editable (por si necesitan ajustarlo para esta acta concreta)
- Debajo, muestre la tabla de "Actividades a desarrollar" con columnas **Actividad** y **Número de pedido** (ya existe, solo se reubica dentro de este bloque)

### 4. Interfaz `ConfigEmpresa`
Añadir `texto_cae_punto1: string` a la interfaz y al `EMPTY_CONFIG`.

## Archivos afectados
- **Migración SQL**: nueva columna en `configuracion_empresa`
- **`src/pages/AdminConfiguracion.tsx`** — nuevo editor en el acordeón CAE
- **`src/components/documentos/formularios/FormActaReunion.tsx`** — reorganizar actividades bajo sección "Punto 1" con texto precargado

