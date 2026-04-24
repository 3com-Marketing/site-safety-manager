## Problema

En el editor de fotos del técnico (`FotoEditor.tsx`), el panel lateral de "Señales de obra" funciona en escritorio y tablet, pero en móvil (viewport ~390px) no es usable:

- El panel siempre se renderiza como una columna lateral fija de `w-48` (192px) al lado del canvas.
- En un móvil de 390px de ancho, abrir ese panel deja apenas ~180px para el canvas, y al estar el botón "Señales" en una toolbar que ya hace overflow, en pantallas estrechas queda fuera de vista o el panel resulta inutilizable.
- Resultado: en móvil el usuario no consigue acceder a las señales.

## Solución

Renderizar el panel de señales de forma **adaptativa según el ancho de pantalla**:

- **Escritorio / tablet (≥768px)**: mantener el comportamiento actual — panel lateral de 192px que reduce el canvas.
- **Móvil (<768px)**: el panel de señales se abre como un **bottom sheet** (cajón inferior) que ocupa todo el ancho, con altura ~45% de la pantalla, scroll vertical y un grid de señales más cómodo (3-4 columnas según quepa). El canvas no se redimensiona; el sheet se superpone con un overlay y se cierra tocando fuera, la X o seleccionando una señal.

Adicionalmente, en la toolbar móvil:
- El botón "Señales" se mantiene visible y accesible (asegurar que no se pierda en el flex-wrap haciéndolo más compacto: solo icono 🚧 sin la palabra en pantallas muy estrechas, o reordenándolo antes del separador final para que sea de los primeros visibles).

## Detalle técnico

Archivo a modificar: `src/components/visita/FotoEditor.tsx`

1. Añadir hook `useIsMobile()` (ya existe en `src/hooks/use-mobile.tsx`) para detectar `<768px`.
2. En `getCanvasSize()`: si es móvil, no descontar los 192px del ancho aunque `showSigns` esté activo (el panel se superpone, no empuja).
3. Renderizado condicional del panel:
   - Si `!isMobile`: render actual (columna lateral `w-48`).
   - Si `isMobile && showSigns`: usar el componente `Sheet` de shadcn (`@/components/ui/sheet`) con `side="bottom"` y altura `h-[50vh]`, conteniendo el mismo grid de señales (ajustar a `grid-cols-4` para móvil).
4. Al hacer click en una señal en móvil, cerrar el sheet automáticamente para que el usuario vea el canvas y pueda colocarla.
5. En la toolbar, en móvil mostrar solo el icono 🚧 sin texto "Señales" para ahorrar espacio.

No cambia nada de la lógica de fabric, ni del guardado, ni del catálogo de señales.

## Archivos a editar

- `src/components/visita/FotoEditor.tsx`

## Resultado esperado

En móvil, al pulsar "🚧" en la toolbar del editor de fotos, se abre un cajón inferior con todas las señales de obra. Al tocar una, se añade al canvas y el cajón se cierra. En tablet y escritorio el comportamiento no cambia.