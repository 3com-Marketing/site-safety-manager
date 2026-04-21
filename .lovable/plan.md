

# Plan: Arreglar el editor de fotos (tamano, carga de imagen y herramientas)

## Problemas detectados

1. **Dialogo demasiado pequeno**: El `DialogContent` base tiene `max-w-2xl` (672px). Aunque el editor pasa `max-w-[98vw]`, el canvas fijo de 900x600 se recorta. Ademas hay un boton X duplicado del propio DialogContent.
2. **La foto original no carga**: La imagen de Supabase Storage puede fallar por CORS al usar `crossOrigin = 'anonymous'`. Si falla, el canvas queda en blanco sin error visible.
3. **Las herramientas no funcionan**: El `saveHistory` tiene un bug de closure obsoleta con `historyIdx` -- al depender de `historyIdx` en `useCallback`, cada cambio de historial recrea la funcion, y como el segundo `useEffect` (de herramientas) tambien depende de `saveHistory`, se re-bindean los eventos continuamente, causando comportamientos erraticos.

## Solucion

### Cambios en `src/components/visita/FotoEditor.tsx`

1. **Dialogo a pantalla completa**: Reemplazar el Dialog de shadcn por un `div` fijo a pantalla completa (`fixed inset-0 z-50`) con fondo oscuro. Esto elimina las restricciones de tamano del DialogContent y el boton X duplicado.

2. **Canvas adaptativo**: En lugar de tamano fijo 900x600, calcular el tamano disponible en funcion de la ventana del navegador (`window.innerWidth`, `window.innerHeight` menos la barra de herramientas). La foto se escala para llenar ese espacio.

3. **Cargar imagen sin CORS bloqueante**: Descargar la imagen via `fetch()` como blob, crear un `URL.createObjectURL()` local, y cargarla desde ahi. Esto evita problemas de CORS con el atributo `crossOrigin`.

4. **Arreglar `saveHistory`**: Usar un `useRef` para el indice de historial en lugar de depender de estado React en el `useCallback`. Esto elimina la dependencia circular y evita que los eventos se re-bindeen constantemente.

5. **Arreglar `getScenePoint`**: Verificar que la API de fabric 6.6.1 usa `getScenePoint` o `getViewportPoint` (la API cambio entre versiones). Usar `getPointer` como fallback seguro si es necesario.

## Archivo afectado

- **`src/components/visita/FotoEditor.tsx`** -- Reescribir el componente con las correcciones de layout, carga de imagen, y gestion de estado del historial.

