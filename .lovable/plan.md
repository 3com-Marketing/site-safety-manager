

# Plan: Navegación entre secciones y bloques en Visita Activa

## Problema
Actualmente, dentro de una visita, al entrar en un bloque (ej: EPIs) o sección (ej: Incidencias), el único botón de acción global es "FINALIZAR VISITA". No hay forma de avanzar al siguiente punto ni volver al menú sin usar la flecha atrás repetidamente.

## Solución
Añadir botones de navegación "Siguiente" y "Anterior" en cada bloque del checklist y en cada sección, permitiendo recorrer toda la visita secuencialmente. El botón "FINALIZAR VISITA" se mantiene pero se complementa con la navegación.

## Flujo de navegación

```text
Secciones (menú) → Datos generales → Checklist/EPIs → Checklist/Orden → ... → Checklist/Maquinaria → Incidencias → Amonestaciones → Observaciones
```

Orden lineal completo:
1. Datos generales
2. EPIs
3. Orden y limpieza
4. Trabajo en altura
5. Señalización
6. Maquinaria
7. Incidencias
8. Amonestaciones
9. Observaciones

## Cambios

### 1. `VisitaActiva.tsx`
- Definir un array con el orden lineal completo de pasos (secciones + bloques del checklist expandidos).
- Añadir funciones `goNext()` y `goPrev()` que cambien el `view` state al paso siguiente/anterior.
- Pasar `onNext` y `onPrev` como props a cada componente de sección y bloque.
- Reemplazar el botón fijo "FINALIZAR VISITA" por una barra inferior con:
  - Botón "Anterior" (si no es el primer paso)
  - Botón "Siguiente" (si no es el último paso)
  - Botón "Finalizar visita" visible siempre (más pequeño si hay siguiente, prominente si es el último paso)

### 2. `ChecklistBloque.tsx`
- Añadir props opcionales `onNext?: () => void` y `onPrev?: () => void`.
- Mostrar botones "Siguiente" / "Anterior" al final del contenido o en la barra inferior.

### 3. `SeccionIncidencias.tsx`, `SeccionAmonestaciones.tsx`, `SeccionObservaciones.tsx`, `SeccionDatosGenerales.tsx`
- Añadir props opcionales `onNext?: () => void` y `onPrev?: () => void`.
- Misma lógica de botones de navegación.

### 4. Barra inferior rediseñada (en `VisitaActiva.tsx`)
- Cuando estamos en el menú de secciones: solo "FINALIZAR VISITA" como ahora.
- Cuando estamos dentro de un paso: barra con "← Anterior", "Siguiente →" y un botón secundario "Finalizar" (siempre accesible).
- En el último paso (Observaciones): "Siguiente" se reemplaza por "FINALIZAR VISITA" como botón principal.

## Archivos modificados
| Archivo | Cambio |
|---|---|
| `src/pages/VisitaActiva.tsx` | Lógica de navegación lineal, barra inferior con prev/next/finalizar |
| `src/components/visita/ChecklistBloque.tsx` | Eliminar botón back propio del header (ya está en la barra), aceptar onNext/onPrev |
| `src/components/visita/SeccionDatosGenerales.tsx` | Aceptar onNext/onPrev |
| `src/components/visita/SeccionIncidencias.tsx` | Aceptar onNext/onPrev |
| `src/components/visita/SeccionAmonestaciones.tsx` | Aceptar onNext/onPrev |
| `src/components/visita/SeccionObservaciones.tsx` | Aceptar onNext/onPrev |

## UX
- Los datos se guardan automáticamente al cambiar de sección (ya se guardan en tiempo real al crear anotaciones/incidencias).
- Se puede saltar a cualquier sección desde el menú principal (flecha atrás → menú secciones).
- Se puede navegar linealmente con Siguiente/Anterior sin volver al menú.
- Finalizar está siempre disponible desde cualquier punto.

