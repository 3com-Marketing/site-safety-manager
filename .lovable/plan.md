

# Plan: Mostrar fotos completas sin recortar

## Problema
Las fotos en anotaciones, incidencias, amonestaciones y observaciones usan `max-h-48 object-cover`, lo que recorta la imagen a 192px de alto. En pantallas grandes (tablet/desktop) la imagen queda cortada y no se ve entera.

## Solución
Cambiar `object-cover` por `object-contain` y eliminar `max-h-48` (o aumentarlo significativamente) para que la imagen se muestre completa. Además, hacer las fotos clicables para abrirlas a pantalla completa en un modal (preparación para la fase de edición futura).

## Cambios

### 1. Todas las imágenes: quitar recorte
En los 4 archivos, cambiar la clase de las fotos de:
```
max-h-48 object-cover
```
a:
```
max-h-[400px] object-contain bg-muted/50
```
Esto muestra la foto completa (sin recortar), con un fondo sutil detrás si hay espacio vacío.

### 2. Modal de foto a pantalla completa (nuevo componente)
Crear `src/components/visita/FotoViewer.tsx`: un Dialog sencillo que muestra la imagen al 100% al hacer clic. Preparado para añadir herramientas de edición en el futuro.

### 3. Integrar el visor en los 4 archivos
Hacer que cada `<img>` sea clicable y abra el `FotoViewer`.

| Archivo | Cambio |
|---|---|
| `src/components/visita/FotoViewer.tsx` | Nuevo — modal visor de foto |
| `src/components/visita/ChecklistBloque.tsx` | Foto sin recorte + clic para ampliar |
| `src/components/visita/SeccionIncidencias.tsx` | Foto sin recorte + clic para ampliar |
| `src/components/visita/SeccionAmonestaciones.tsx` | Foto sin recorte + clic para ampliar |
| `src/components/visita/SeccionObservaciones.tsx` | Foto sin recorte + clic para ampliar |

