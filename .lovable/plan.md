

# Plan: Anadir boton borrar objeto y arreglar deshacer

## Problemas

1. **No hay boton para borrar un objeto seleccionado**: Falta un boton de papelera/borrar en la barra de herramientas.
2. **Deshacer no funciona**: `saveHistory` serializa el canvas con `toJSON()`, que incluye la imagen de fondo como referencia a un blob URL. Cuando se hace undo, `loadFromJSON` intenta recargar esa blob URL, que ya fue revocada con `URL.revokeObjectURL`. Esto hace que la imagen de fondo desaparezca y el undo falle.

## Solucion

### 1. Boton borrar objeto seleccionado
- Importar el icono `Trash2` de lucide-react.
- Anadir un boton en la barra de herramientas (junto a undo/redo) que al pulsar elimina el objeto activo del canvas (`canvas.getActiveObject()` + `canvas.remove(obj)`) y guarda en historial.
- Tambien escuchar la tecla `Delete`/`Backspace` para borrar el objeto seleccionado.

### 2. Arreglar undo/redo
- En lugar de serializar todo el canvas con `toJSON()` (que incluye la backgroundImage y su URL), guardar solo los objetos del canvas (`canvas.getObjects()` serializados).
- Al hacer undo/redo, limpiar los objetos del canvas y restaurar solo los objetos del historial, sin tocar la backgroundImage que ya esta cargada y permanece fija.
- Esto evita el problema de la blob URL revocada.

## Archivo afectado

- **`src/components/visita/FotoEditor.tsx`** -- Anadir boton borrar, listener de tecla Delete, y cambiar historial para que solo guarde/restaure objetos (no la imagen de fondo).

