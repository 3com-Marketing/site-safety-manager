

# Plan: Conectar el editor de fotos en las vistas de admin

## Problema

El editor de fotos (FotoEditor) esta implementado pero no se puede acceder a el porque:

1. En `AdminVisitaDetalle.tsx`: el FotoViewer se usa sin las props `editable`, `onSave` ni `visitaId`, asi que nunca muestra el boton "Editar foto".
2. En `AdminInformeDetalle.tsx`: las fotos se renderizan como etiquetas `<img>` planas, sin usar FotoViewer, asi que no hay forma de abrirlas ni editarlas.

## Solucion

### 1. `AdminVisitaDetalle.tsx` — Habilitar edicion en el visor

- Pasar `editable`, `onSave` y `visitaId` al componente `FotoViewer` existente (linea 105).
- El `visitaId` ya esta disponible como `id` (de `useParams`).
- El `onSave` necesita identificar que registro actualizar. Se guardara junto con la URL un identificador del origen (tabla + id del registro) para poder hacer el UPDATE correcto al guardar.
- Actualizar la foto en la tabla correspondiente (`anotaciones.foto_url`, `fotos.url`, `amonestaciones.foto_url`, `observaciones.foto_url`) segun de donde venga.

### 2. `AdminInformeDetalle.tsx` — Usar FotoViewer en lugar de `<img>` planos

- Importar `FotoViewer`.
- Anadir estado `viewingFoto` y `fotoMeta` (para saber tabla e ID del registro).
- Reemplazar los `<img>` clickeables por thumbnails que al hacer click abren el FotoViewer con `editable={true}`.
- Secciones afectadas:
  - Checklist: las fotos de anotaciones (linea ~401)
  - Incidencias: las fotos de la tabla `fotos` (linea ~451-455)
  - Amonestaciones: las fotos (linea ~518)
  - Observaciones: las fotos (linea ~567)
- El `onSave` hara UPDATE en la tabla correspondiente y recargara los datos.

## Archivos afectados

- **`src/pages/AdminVisitaDetalle.tsx`** — Pasar `editable={true}`, `onSave` y `visitaId` al FotoViewer.
- **`src/pages/AdminInformeDetalle.tsx`** — Importar FotoViewer, anadir estado para foto seleccionada, reemplazar `<img>` por thumbnails clickeables que abren el visor/editor.

