

# Plan: Permitir acceso y edición de visitas finalizadas durante 7 días

## Problema
Dos bloqueos actuales:
1. **TechHome**: Las visitas finalizadas no son clicables (línea 85: `v.estado === 'en_progreso' ? navigate(...) : null`)
2. **VisitaActiva**: Si el estado es `finalizada`, redirige al inicio inmediatamente (línea 117)

## Solución
Permitir entrar en visitas finalizadas si han pasado menos de 7 días desde su fecha. Dentro, se puede editar todo igual, pero el botón "FINALIZAR" no aparece (ya está finalizada). Se añade un badge indicando "Editable hasta [fecha]".

## Cambios

### 1. `src/pages/TechHome.tsx`
- Hacer clicables las visitas finalizadas si `fecha + 7 días > ahora`
- Mostrar icono `ChevronRight` también en esas visitas
- Cambiar el badge a "Editable" (amarillo) si está dentro del plazo, "Finalizada" (verde) si ya no

### 2. `src/pages/VisitaActiva.tsx`
- Cambiar la condición de la línea 117: en vez de redirigir si `estado === 'finalizada'`, calcular si `fecha + 7 días > ahora`. Solo redirigir si ha expirado el plazo
- Guardar un flag `isReadOnly` (false si en_progreso o dentro del plazo de 7 días)
- Guardar la fecha de la visita para mostrar "Editable hasta X"
- Mostrar un banner informativo en la cabecera: "Visita finalizada · Editable hasta [fecha]"
- Ocultar el botón "FINALIZAR VISITA" si ya está finalizada (solo mostrar "Guardar y salir")
- En la vista de steps, permitir navegación normal (Anterior/Siguiente) sin botón de finalizar

### 3. Helper de fecha
- Función `isWithinEditWindow(fecha: string): boolean` → `differenceInDays(new Date(), new Date(fecha)) < 7`
- Usar `date-fns` (ya instalado) para `addDays` y `format`

| Archivo | Cambio |
|---|---|
| `src/pages/TechHome.tsx` | Visitas finalizadas clicables si < 7 días |
| `src/pages/VisitaActiva.tsx` | Permitir acceso a finalizadas < 7 días, banner informativo, ocultar finalizar |

