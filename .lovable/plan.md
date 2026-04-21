

# Plan: Alinear estilo visual de Incidencias, Amonestaciones y Observaciones

Aplicar el mismo patron visual usado en `ChecklistBloque.tsx` a los tres componentes, sin tocar logica de negocio.

## Cambios por componente

### 1. `SeccionIncidencias.tsx`

- **Header**: Reemplazar `ArrowLeft` + titulo por breadcrumb naranja con `ChevronLeft` + `obraNombre` encima, y titulo grande debajo (igual que ChecklistBloque).
- **Botones de accion**: Cambiar de `grid-cols-2` con emojis a `grid-cols-3` con iconos Lucide (`Camera`, `Mic`, `StickyNote`), con clase `text-primary` en los iconos.
- **Anadir boton "Nota" manual**: Tercer boton que despliega un textarea inline para escribir texto manual (crea incidencia con descripcion directa).
- **Estado vacio mejorado**: Reemplazar el `<p>` simple por un bloque centrado con icono `FileText` en fondo `bg-muted` y texto descriptivo (mismo patron que ChecklistBloque).
- **Fechas en fotos**: Reemplazar emoji 📅 por icono `Calendar` de Lucide o simplemente quitar el emoji y dejar solo el texto.

### 2. `SeccionAmonestaciones.tsx`

- **Header**: Mismo cambio de breadcrumb naranja con `ChevronLeft`.
- **Botones de accion**: Mismo cambio a `grid-cols-3` con `Camera`, `Mic`, `StickyNote` (los tres piden nombre de trabajador primero, manteniendo la logica existente de `startAction`).
- **Nota manual**: Anadir accion `'note'` al pendingAction que tras pedir nombre de trabajador abra un textarea inline.
- **Estado vacio mejorado**: Mismo bloque centrado con icono.
- **Fechas en fotos**: Quitar emoji 📅.

### 3. `SeccionObservaciones.tsx`

- **Header**: Mismo cambio de breadcrumb naranja.
- **Botones de accion**: Mismo cambio a `grid-cols-3` con Lucide icons.
- **Nota manual**: Tercer boton que abre textarea inline para guardar observacion de texto.
- **Estado vacio mejorado**: Mismo bloque centrado con icono.
- **Fechas en fotos**: Quitar emoji 📅.

## Patron visual de referencia (de ChecklistBloque)

```tsx
// Breadcrumb
<button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
  <ChevronLeft className="h-4 w-4" />
  {obraNombre}
</button>
<h2 className="font-heading text-xl font-bold">{titulo}</h2>

// Botones de accion
<div className="grid grid-cols-3 gap-2">
  <button className="field-action-btn">
    <Camera className="h-7 w-7 text-primary" />
    <span className="label">Foto</span>
  </button>
  ...
</div>

// Estado vacio
<div className="flex flex-col items-center gap-3 py-10 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
    <FileText className="h-8 w-8 text-muted-foreground" />
  </div>
  <p className="text-sm text-muted-foreground">Sin registros aún.<br />Usa los botones de arriba para añadir.</p>
</div>
```

## Archivos afectados

- **`src/components/visita/SeccionIncidencias.tsx`**
- **`src/components/visita/SeccionAmonestaciones.tsx`**
- **`src/components/visita/SeccionObservaciones.tsx`**

