

# Plan: Permitir editar documentos (informes) tanto para técnicos como administradores

## Problema

Los documentos de obra (informes CSS, AT, actas, etc.) no tienen botón de edición en la lista. El administrador tiene la ruta `/admin/documento/:id` para editar, pero no hay enlace visible en la lista del técnico (`DocumentosList`). Los técnicos no pueden acceder a la edición de ninguna forma.

## Solución

### 1. Añadir botón "Editar" en `DocumentosList`

Añadir un botón de edición (icono lápiz) en cada fila de documento que navegue a la página de detalle/edición. El componente detectará si el usuario es admin o técnico para usar la ruta correcta:
- Admin: `/admin/documento/:id`
- Técnico: `/documento/:id` (nueva ruta)

### 2. Crear página `TechDocumentoDetalle`

Nueva página en `src/pages/TechDocumentoDetalle.tsx` que reutiliza la misma lógica de `AdminDocumentoDetalle` pero con navegación adaptada al técnico (botón atrás va a `/documentos`), sin el layout de admin. Incluirá el formulario de edición correspondiente al tipo de documento y el botón de generar PDF.

### 3. Añadir ruta para técnicos

En `App.tsx`, añadir:
```
/documento/:id → TechDocumentoDetalle
```

## Archivos afectados

- **`src/components/documentos/DocumentosList.tsx`** — Añadir botón "Editar" con icono `Pencil` que navega a la ruta de detalle (admin o tech según prop)
- **`src/pages/TechDocumentoDetalle.tsx`** — Nueva página de edición para técnicos, basada en `AdminDocumentoDetalle` pero con header/navegación de técnico
- **`src/App.tsx`** — Añadir ruta `/documento/:id`

