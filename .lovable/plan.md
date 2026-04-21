

# Plan: Arreglar senales no visibles y guardado de imagen editada

## Problemas

1. **Senales no se ven en el canvas**: La funcion `addSign` carga los SVGs como `Image` via blob URL y luego crea `fabric.FabricImage`. Esto falla porque:
   - Los SVGs con emojis en elementos `<text>` (🧤, 🧯, 👥) no se renderizan al rasterizar a canvas
   - `fabric.FabricImage` desde SVG blob no es fiable en todos los navegadores
   - Solucion: usar `fabric.loadSVGFromString()` que parsea el SVG nativamente en objetos fabric, y reemplazar los emojis por formas SVG reales

2. **No guarda la imagen editada**: El metodo `canvas.toDataURL()` en fabric v6 puede devolver un string vacio o fallar si la imagen de fondo esta "tainted". Ademas falta capturar errores especificos. Solucion: verificar que el blob generado tiene contenido antes de subir, y anadir logs de depuracion.

## Cambios

### 1. `src/components/visita/editorSignos.ts`
- Reemplazar los emojis (🧤, 🧯, 👥, ⚡, ⚙, ✋) por formas SVG dibujadas (paths, circles, rects) para que se rendericen correctamente en canvas
- Los emojis no se renderizan cuando un SVG se carga como imagen en canvas

### 2. `src/components/visita/FotoEditor.tsx`
- **`addSign`**: Reemplazar la carga via `Image` + `FabricImage` por `fabric.loadSVGFromString()`. Esta funcion parsea el SVG y devuelve objetos fabric nativos (paths, circles, etc.) que se renderizan correctamente en el canvas. Agruparlos con `fabric.util.groupSVGElements()` para que se muevan como una sola pieza.
- **`handleSave`**: Anadir validacion del blob (comprobar `blob.size > 0`) antes de subir. Anadir `console.error` detallado si la subida falla. Verificar que `toDataURL` genera datos validos.

## Archivos afectados
- **`src/components/visita/editorSignos.ts`** -- Reemplazar emojis por formas SVG puras
- **`src/components/visita/FotoEditor.tsx`** -- Cambiar `addSign` a usar `loadSVGFromString`, mejorar `handleSave` con validacion

