## Objetivo

Mejorar la usabilidad del panel lateral "Señales de obra" del editor de fotos sin tocar nada de las herramientas de dibujo, deshacer/rehacer, eliminar ni guardar. Solo se modifica el panel de señales y su layout.

## Cambios

### 1. Panel desktop más ancho y mejor distribuido (`FotoEditor.tsx`)

- Ampliar el panel lateral de `w-48` (192px) a `w-72` (288px) en desktop, y a `w-80` (320px) en pantallas grandes (`lg:w-80`).
- Ajustar `getCanvasSize()` para usar el nuevo ancho cuando el panel está abierto (288/320 en lugar de 192).
- Cambiar la cuadrícula de señales de `grid-cols-3` a `grid-cols-3` con celdas más grandes (imagen 14×14 en vez de 10×10, texto a `text-[11px]`) para que se lean bien.
- Sustituir los chips de categoría horizontales por una **lista vertical de categorías estilo "pestañas verticales"** en una columna estrecha a la izquierda del panel (≈ 90px), y la cuadrícula de señales ocupa el resto. Cada categoría es un botón apilado con scroll vertical si hay muchas. Esto da más espacio útil que los chips horizontales actuales.
- Añadir al principio de la lista de categorías una opción **"Todas"** (icono `LayoutGrid`) que cuando está seleccionada agrupa las señales por categoría con un encabezado sticky por grupo y permite scroll vertical continuo por todo el repositorio.
- El contenedor de la cuadrícula usa `overflow-y-auto` con `max-h` calculado por flex para garantizar scroll vertical fluido.
- Añadir un buscador opcional arriba (input pequeño) que filtra por `nombre` dentro de la categoría seleccionada o en "Todas". Mejora drásticamente el descubrimiento cuando hay decenas de señales.

Estructura desktop resultante:

```text
+--------+-----------------------------+
| Cat A  |  [buscar...]                |
| Cat B  |  ┌──┐ ┌──┐ ┌──┐             |
| Cat C  |  │  │ │  │ │  │   scroll ↕  |
| Todas  |  └──┘ └──┘ └──┘             |
| ...    |  ...                        |
+--------+-----------------------------+
```

### 2. Modo "Todas" (vista agrupada con scroll vertical)

- Cuando `selectedCatId === '__all__'`, en lugar de filtrar por categoría se renderiza una lista vertical de secciones, una por categoría activa, cada una con su título sticky (`sticky top-0 bg-card z-10`) y debajo la cuadrícula de señales de esa categoría.
- Funciona igual en desktop, tablet y móvil.

### 3. Responsive tablet (nuevo breakpoint)

Actualmente `useIsMobile` solo distingue <768px (móvil) vs resto (desktop). En tablet (768–1024px) el panel lateral de 288px deja muy poco canvas.

- Añadir un hook ligero `useIsTabletOrMobile` (o reutilizar `useIsMobile` con un segundo breakpoint local en `FotoEditor`) que detecte `< 1024px`.
- En ese rango, el panel de señales se abre como **bottom sheet a pantalla casi completa** (`h-[85vh]`), no como panel lateral. Así el canvas queda íntegro detrás y el panel es totalmente usable a pulgar.
- En el bottom sheet se aplica el mismo layout nuevo: columna izquierda de categorías (más estrecha, `w-20`), cuadrícula a la derecha con scroll vertical, opción "Todas" y buscador. En móviles muy estrechos (<480px) las categorías se colapsan a un `Select` desplegable arriba para no robar espacio.

### 4. Botones táctiles más grandes

- Botones de categoría: `min-h-11` (44px) en móvil/tablet siguiendo la guía de UX táctil del proyecto.
- Botones de señal: padding `p-2`, área táctil ≥ 56×56.
- Al pulsar una señal en móvil/tablet el sheet se cierra (ya existe ese comportamiento, se mantiene); en desktop el panel permanece abierto.

### 5. Lo que NO se toca

- Toolbar de herramientas (`TOOLS`, `COLORS`, `STROKE_WIDTHS`).
- Lógica de dibujo (`onMouseDown/Move/Up`, `path:created`).
- `undo`, `redo`, `deleteSelected`, listener de teclado.
- `addSign` (carga de SVG/raster).
- `handleSave` y subida a `incidencia-fotos`.
- Hooks `useSignoCategorias`, `useSignosObra` y la BD.

## Detalle técnico

Archivos a modificar:

- `src/components/visita/FotoEditor.tsx`
  - Reemplazar el bloque del panel desktop (líneas ~511–560) y del bottom sheet móvil (líneas ~563–613) por el nuevo layout descrito.
  - Actualizar `getCanvasSize()` para el nuevo ancho.
  - Añadir estado local `query` (string) para el buscador y constante `ALL_ID = '__all__'`.
  - Añadir un breakpoint `useIsTabletOrMobile` derivado de `window.matchMedia('(max-width: 1023px)')` (mismo patrón que `use-mobile.tsx`) o inline con un `useEffect`.

Archivos nuevos (opcional, recomendado):

- `src/hooks/use-tablet.tsx` con `useIsTabletOrBelow()` siguiendo el patrón de `use-mobile.tsx`.

Sin migraciones de base de datos, sin cambios en otras pantallas.
