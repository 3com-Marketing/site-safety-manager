# Repositorio dinámico de señales de obra

Sustituir las señales hardcodeadas (`src/components/visita/editorSignos.ts`) por un sistema gestionable desde el panel de administración, con categorías editables, imágenes subidas por la empresa y filtrado en el panel lateral del editor de fotos.

**Lo que NO cambia**: herramientas de dibujo, colores, grosor, deshacer/rehacer, eliminar, guardar, y todo el flujo de edición. Solo se modifica el panel lateral derecho "Señales de obra".

---

## 1. Base de datos (migración)

**Tabla `signo_categorias`**
- `id` uuid PK · `nombre` text · `orden` int default 0 · `activa` bool default true · `created_at` timestamptz

**Tabla `signos_obra`**
- `id` uuid PK · `nombre` text · `categoria_id` uuid FK → `signo_categorias(id)` ON DELETE RESTRICT · `imagen_url` text · `activa` bool default true · `orden` int default 0 · `created_at` timestamptz

**RLS**:
- SELECT: cualquier usuario autenticado (técnicos y admin pueden ver/usar).
- INSERT/UPDATE/DELETE: solo `has_role(auth.uid(), 'admin')`.

**Storage**: nuevo bucket público `signos-obra` para las imágenes (PNG/SVG/JPG). Política: lectura pública; escritura solo admin.

**Seed inicial**: insertar las 4 categorías actuales (Prohibición, Obligación, Advertencia, Emergencia) y las 16 señales existentes — pero las imágenes seed serán los SVG actuales convertidos a `data:image/svg+xml;base64,...` almacenados en `imagen_url` para no perder el estado actual mientras la empresa sube las suyas. Esto evita una migración de archivos a Storage en el momento del cambio.

---

## 2. Panel lateral del editor de fotos

Modificar `src/components/visita/FotoEditor.tsx`:

- Eliminar el import de `SIGNOS_OBRA` y reemplazar por una consulta con React Query a `signo_categorias` + `signos_obra` (solo `activa=true`, ordenadas por `orden`).
- Encima del grid, añadir un **selector de categorías** (tabs horizontales con `ScrollArea`; en móvil, un `Select` compacto). Construido dinámicamente desde la BD.
- Por defecto, seleccionar la primera categoría activa.
- El grid muestra solo señales de la categoría activa.
- Si la categoría no tiene señales activas: mensaje neutro "No hay señales en esta categoría".
- La función `addSign` se adapta para aceptar una señal con `imagen_url` en lugar de SVG inline:
  - Si la URL es SVG (extensión `.svg` o `data:image/svg+xml`): cargarla como texto y usar `fabric.loadSVGFromString` (mantiene el comportamiento actual).
  - Si es raster (PNG/JPG): usar `fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })`, escalar a ~60px de ancho, centrar y `saveHistory` igual que ahora.
- Mismo comportamiento en escritorio (panel lateral) y móvil (`Sheet` inferior).
- **Sin cambios** en el resto del editor.

Eliminar el archivo `src/components/visita/editorSignos.ts` una vez migrado el seed.

---

## 3. Sección admin "Repositorio de señales"

**Nueva ruta**: `/admin/senales` → `src/pages/AdminSenales.tsx`. Añadir entrada en `AdminLayout.tsx` (icono `TrafficCone` o `Construction`) entre "Documentos" y "Configuración".

Página con dos pestañas (`Tabs` de shadcn): **Categorías** y **Señales**.

### Pestaña "Categorías"
Tabla/listado con drag-and-drop de orden (usar `@dnd-kit/core` ya instalado; si no, `@hello-pangea/dnd` — verificar antes; alternativa simple: campos numéricos de orden con botones ↑/↓ para no añadir dependencias).
- Crear categoría (nombre + orden + activa).
- Renombrar inline.
- Toggle activa/inactiva (`Switch`).
- Eliminar:
  - Si no tiene señales asociadas → eliminar directo (con confirmación).
  - Si tiene señales → diálogo: "Esta categoría tiene N señales. ¿Qué deseas hacer?" con opciones: **Reasignar a otra categoría** (Select) o **Eliminar también las señales**. Acción atómica vía SQL.

### Pestaña "Señales"
Filtro por categoría arriba. Grid de tarjetas con miniatura, nombre, categoría, estado.
- Botón "Subir señal": diálogo con `FileInput` (acepta PNG/SVG/JPG, máx 1MB), nombre y categoría. Sube a bucket `signos-obra` y crea registro.
- Editar nombre/categoría/orden por señal (diálogo).
- Toggle activa/inactiva.
- Eliminar señal (con confirmación; también borra el archivo del bucket).

**Acceso**: la página comprueba `has_role` admin al montar; si no, redirige a `/`. La ruta no aparece en el menú para no-admins.

---

## 4. Acceso por rol

- **Técnico**: `FotoEditor` lee las señales activas → puede usarlas. No ve la sección admin.
- **Admin**: mismo editor de fotos + acceso completo a `/admin/senales`.

RLS de la BD garantiza la separación a nivel de servidor.

---

## Detalles técnicos

- **Hook nuevo**: `src/hooks/useSignosObra.ts` — React Query para `categorias` y `signos`, con `staleTime: 5 min`. Reutilizado por editor y admin.
- **Compatibilidad SVG**: el helper `addSign` detecta tipo por extensión/data-URI y elige rama. Para SVGs subidos al bucket, se hace `fetch(url).then(r => r.text())` y luego `loadSVGFromString` — esto requiere CORS público en el bucket (ya configurado por defecto en buckets públicos).
- **Migración de datos**: el seed insertará categorías + señales con sus SVG actuales en `imagen_url` como `data:image/svg+xml;base64,...`. La empresa puede después reemplazar cada señal subiendo una imagen propia desde el admin.
- **Sin tocar**: toolbar, lógica de undo/redo/delete/save, persistencia, layout general del editor.

---

## Archivos a crear / modificar

**Crear**
- Migración SQL (tablas, RLS, bucket, seed).
- `src/hooks/useSignosObra.ts`
- `src/pages/AdminSenales.tsx`
- `src/components/admin/senales/CategoriasManager.tsx`
- `src/components/admin/senales/SenalesManager.tsx`
- `src/components/admin/senales/SubirSenalDialog.tsx`
- `src/components/admin/senales/EliminarCategoriaDialog.tsx`

**Modificar**
- `src/components/visita/FotoEditor.tsx` (panel lateral dinámico + addSign con URL)
- `src/components/admin/AdminLayout.tsx` (nueva tab "Señales")
- `src/App.tsx` (ruta `/admin/senales`)

**Eliminar (al final, tras verificar)**
- `src/components/visita/editorSignos.ts`
