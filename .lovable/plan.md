

# Plan: Arreglar el guardado de fotos editadas

## Problema

Los logs muestran que la imagen editada se sube correctamente al storage (blob de ~3MB, URL generada). Sin embargo, la URL nueva no se persiste en la base de datos porque:

1. El `supabase.from(fotoMeta.table).update(...)` en `AdminVisitaDetalle.tsx` no comprueba si hay error en la respuesta. Si falla por RLS o por cualquier otro motivo, se ignora silenciosamente.
2. En `AdminInformeDetalle.tsx` puede haber el mismo problema.
3. No hay feedback al usuario si el UPDATE falla.

## Solucion

### 1. `src/pages/AdminVisitaDetalle.tsx` (lineas 111-137)

- Capturar el resultado del `update` y comprobar `error`.
- Si hay error, mostrarlo con `toast.error` y hacer `console.error`.
- Si no hay error, proceder con el re-fetch.

### 2. `src/pages/AdminInformeDetalle.tsx`

- Mismo cambio: verificar error en el `handleSaveFoto` o la funcion equivalente que hace el UPDATE.
- Anadir `toast.error` si falla.

### 3. `src/components/visita/FotoEditor.tsx` (linea 323)

- Envolver `await onSave(...)` en try/catch para que si el callback falla, el editor no se cierre y el usuario vea el error.
- Solo llamar `onClose()` si `onSave` resolvio sin error.

## Archivos afectados

- **`src/pages/AdminVisitaDetalle.tsx`** -- Anadir comprobacion de error en el UPDATE de la foto.
- **`src/pages/AdminInformeDetalle.tsx`** -- Anadir comprobacion de error en el UPDATE de la foto.
- **`src/components/visita/FotoEditor.tsx`** -- Proteger `onClose()` para que solo se ejecute si `onSave` no lanza error.

