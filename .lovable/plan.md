

# Plan: Conectar creación de documentos y ajustar vistas existentes

## Resumen

Hay 3 cambios necesarios. La mayoría de componentes ya existen pero no están conectados correctamente.

## 1. AdminDocumentos.tsx — Botón "Nuevo documento" con selector de obra

`NuevoDocumentoDialog` requiere un `obraId` fijo. En AdminDocumentos no hay obra pre-seleccionada, así que:

- Añadir estado `nuevoObraId` y `nuevoOpen`
- Añadir botón "Nuevo documento" junto al título
- Al pulsar, si `filterObra` tiene una obra seleccionada, abrir directamente `NuevoDocumentoDialog` con esa obra
- Si no hay obra seleccionada, mostrar un mini-dialog previo con un Select de obra, y al confirmar abrir `NuevoDocumentoDialog`
- Importar `NuevoDocumentoDialog` y renderizarlo con `obraId={nuevoObraId}`, `onCreated={() => fetchAll()}`
- Importar `AdjuntarDocumentoDialog` y añadir botón "Adjuntar" en la columna de acciones de cada fila (cuando no tiene archivo)

## 2. AdminObras.tsx — Sección Documentación editable (no readOnly)

Actualmente la línea 378 muestra `<DocumentosList obraId={viewObra.id} readOnly />`. Cambiar a `readOnly={false}` (o eliminar el prop) para que el admin pueda crear documentos y adjuntar desde el detalle de obra.

## 3. TechHome.tsx — Ya implementado

La sección "Documentos pendientes" ya existe (líneas 101-123). No requiere cambios.

## Archivos afectados
- **Editado**: `src/pages/AdminDocumentos.tsx` (botón nuevo doc + adjuntar en tabla)
- **Editado**: `src/pages/AdminObras.tsx` (quitar `readOnly` de DocumentosList)

