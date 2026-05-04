## Objetivo

En el formulario del **Acta Reunión CAE**, punto **3.2 — Duración y ubicación de los trabajos**, los campos **Inicio** y **Fin** son actualmente inputs de texto libre. Hay que sustituirlos por un selector que permita elegir **fecha y hora** (calendario + reloj) tanto para el inicio como para el fin de cada trabajo, dejándolos opcionales ("si procediera").

## Cambios

### 1. Formulario — `src/components/documentos/formularios/FormActaReunion.tsx`

En el bloque de la línea ~724 (el grid de "nueva fila") y en la lista renderizada (líneas ~712‑723):

- Sustituir los dos `<Input placeholder="Inicio">` y `<Input placeholder="Fin">` por inputs nativos `type="datetime-local"`. Esto activa en navegadores de escritorio y tablet el **selector de fecha (calendario)** y el **selector de hora (reloj)** de forma nativa, sin dependencias añadidas y compatible con tablet (prioridad UX del proyecto).
- Mantener el resto de campos (Título, Observaciones) y el botón Añadir igual.
- Como los campos son opcionales, no se valida que estén rellenos para poder añadir la fila (basta con que `titulo` esté presente, igual que ahora).
- Al renderizar cada fila ya guardada, formatear `inicio` / `fin` a un formato legible en español (`dd/MM/yyyy HH:mm`) usando `date-fns` (ya disponible en el proyecto). Si el campo está vacío se muestra un guion `—`.

Estructura aproximada:

```text
[ Título ] [ 📅🕒 Inicio ] [ 📅🕒 Fin ] [ Observaciones ] [ + Añadir ]
```

El estado `nuevaDuracion` y el array `duracionTrabajos` siguen guardando `inicio` y `fin` como strings (formato ISO `YYYY-MM-DDTHH:mm` que devuelve `datetime-local`). No hay cambios de tipos ni de base de datos.

### 2. Generador de PDF — `supabase/functions/generar-documento-pdf/index.ts`

En la sección que renderiza `extra.duracion_trabajos` (punto 3.2 del Acta Reunión CAE), formatear los valores `inicio` y `fin` para que en el PDF aparezcan como `dd/MM/yyyy HH:mm` en lugar de la cadena ISO cruda. Si alguno viene vacío, mostrar `—`.

### 3. Lo que NO cambia

- No se modifica la base de datos (sigue siendo `datos_extra` JSON).
- No se modifica el tipo `DatosActaReunionCAE` en `src/types/documentos.ts` (los campos siguen siendo `string`).
- Filas ya guardadas con texto libre antiguo seguirán mostrándose tal cual (fallback: si el string no es una fecha ISO válida, se muestra el texto original).

## Notas técnicas

- `<input type="datetime-local">` es la solución más sencilla, accesible y táctil; evita añadir un componente compuesto Popover+Calendar+TimePicker (shadcn no incluye time picker nativo).
- Se añadirá un pequeño helper `formatFechaHora(value: string)` reutilizable dentro del propio componente.
