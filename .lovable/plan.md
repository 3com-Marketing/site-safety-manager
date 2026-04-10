

# Plan: Añadir botón "Guardar y salir" en la pantalla de secciones

## Problema
En la pantalla de secciones (menú principal de la visita), el único botón es "FINALIZAR VISITA". No hay forma de salir dejando la visita en progreso para volver más tarde. El botón de flecha atrás en el header tiene un bug: el `onClick` está en el icono `ArrowLeft` dentro del `Button`, lo que causa comportamiento inconsistente.

## Solución
Reemplazar la barra inferior en la vista de secciones para mostrar dos botones:
- **"Guardar y salir"** (outline) — navega a `/` sin cambiar el estado de la visita (queda "en_progreso")
- **"FINALIZAR VISITA"** (verde, como ahora) — finaliza la visita

También corregir el header para que la flecha atrás funcione correctamente navegando a `/`.

## Cambios

### `src/pages/VisitaActiva.tsx`
1. **Header**: Corregir el botón atrás. Cuando `view === 'secciones'`, el `onClick` del `Button` debe hacer `navigate('/')`. Eliminar el `onClick` duplicado del icono `ArrowLeft`.
2. **Barra inferior en vista secciones**: Cambiar de un solo botón a dos:
   - `Guardar y salir` (variant outline, con icono `ArrowLeft`) → `navigate('/')`
   - `FINALIZAR VISITA` (verde, como ahora)

| Archivo | Cambio |
|---|---|
| `src/pages/VisitaActiva.tsx` | Fix header back button, add "Guardar y salir" en barra inferior |

