# Modal "Nueva visita" en dos opciones + Panel lateral con contadores

Se modifica únicamente `src/pages/AdminCalendario.tsx`. Se reescriben los dos sub-componentes ya existentes en ese archivo (`NuevaVisitaDialog` y `VisitaDetalleSheet`) y se ajusta lo que la página les pasa por props. Ningún otro archivo se toca.

## 1. Modal "Nueva visita" — flujo en dos opciones

Al pulsar `+` en una celda vacía se abre el modal con:

- Título: "Nueva visita" + fecha precargada (ej: "Martes 28 de abril").
- **Selector de modo** en dos chips arriba: `Desde la obra` / `Desde el técnico`.
  - Si el calendario estaba en pivot `obra` con una obra filtrada → arranca en "Desde la obra" con la obra preseleccionada.
  - Si estaba en pivot `técnico` con uno filtrado → arranca en "Desde el técnico" con ese técnico preseleccionado.
  - El usuario puede cambiar de modo en cualquier momento.

### Opción A — Desde la obra
1. `Select` de obra (todas, ordenadas).
2. Al elegir obra, lista de técnicos asignados a esa obra (`tecnicos_obras`). Cada técnico se muestra como tarjeta clicable con:
   - Nombre completo.
   - **Indicador de disponibilidad ese día** según las visitas existentes para ese técnico ese día (excluyendo `cancelada`):
     - Verde · "Disponible" → 0 visitas
     - Naranja · "1 visita ese día" → 1
     - Rojo · "N visitas ese día" → ≥2
3. El usuario hace clic en una tarjeta para seleccionar técnico.
4. Si la obra no tiene técnicos asignados: mensaje "Esta obra no tiene técnicos asignados".

### Opción B — Desde el técnico
1. `Select` de técnico.
2. Al elegir técnico, lista de obras asignadas a ese técnico. Cada obra como tarjeta clicable con:
   - Nombre.
   - Contador "X visitas esta semana en esta obra" (visitas del técnico en esa obra durante la semana visible, excluyendo `cancelada`).
3. El usuario hace clic en una tarjeta para seleccionar obra.

### Campos comunes (debajo)
- Hora (input `time`, default `09:00`).
- Estado (default `programada`; opciones: programada, pendiente_confirmar, finalizada).

### Aviso de solape
Si el técnico seleccionado ya tiene al menos una visita ese día (cualquier obra, excluyendo `cancelada`), banner amarillo encima del botón Crear:
> "Este técnico ya tiene N visita(s) ese día." (informativo, no bloquea).

### Confirmar
- Validación: obra + técnico + técnico con `user_id`.
- `INSERT` en `visitas` con `obra_id`, `usuario_id`, `fecha` (combinando día + hora), `estado`.
- Toast de éxito + cerrar modal + `fetchVisitas()` (refresco sin recargar).

### Datos que necesita el modal (props añadidas)
- `visitasSemana: Visita[]` (las ya cargadas para la semana, sirven para los contadores y el aviso del mismo día).
- `tecnicosByObra: Record<string, string[]>`
- `obrasByTecnico: Record<string, string[]>`
- `tecByUserId: Map<string, Tecnico>` (para mapear visitas → técnico)
- `ctx.modoInicial: 'obra' | 'tecnico'` (deducido del pivot actual)

## 2. Panel lateral de detalle (`VisitaDetalleSheet`)

Se rediseña el contenido del `Sheet` existente. Sigue siendo un `Sheet side="right"` de shadcn que ya cierra al clicar fuera o con la X.

### Cabecera
- Título: "Detalle de visita".
- Subtítulo: día + hora formateada en español.

### Bloque de información
- **Obra**: nombre + dirección (si está disponible en obras cargadas; si no, solo nombre).
- **Técnico**: nombre completo.
- **Estado**: chip con el color del estado.
- **Fecha**: legible.

### Contadores
Se calculan a partir de `visitasSemana` ya cargadas:
- **En esta obra esta semana**: nº de visitas del técnico en la misma obra durante la semana visible (excluyendo cancelada).
- **Total esta semana**: nº de visitas del técnico esa semana en cualquier obra.

Mostrar como dos pequeñas tarjetas con número grande y etiqueta debajo.

### Acciones según estado
- `programada` o `pendiente_confirmar`:
  - Editar fecha/hora (inputs date+time).
  - Cambiar estado (Select con las opciones aplicables).
  - Cancelar visita (botón rojo → UPDATE estado='cancelada').
- `en_progreso`:
  - Solo cambiar estado (a `finalizada` o `cancelada`).
  - Sin edición de fecha (la visita está activa).
- `finalizada`:
  - Solo lectura + botón "Reabrir" (cambia a `en_progreso`) y botón "Cancelar visita".
- `cancelada`:
  - Solo lectura + botón "Restaurar como programada".

### Guardar
- Botón principal `Guardar cambios` (visible solo si hay cambios pendientes en fecha/estado).
- Tras guardar: toast + `fetchVisitas()` + cerrar panel.

### Datos que necesita el sheet (props añadidas)
- `visitasSemana: Visita[]` (para los contadores).

## Cambios en la página principal

Solo dos puntos:

1. **`setNuevaCtx`** ahora también guarda `modoInicial: pivot` (el modo activo del calendario) para que el modal arranque en la opción correcta. La preselección de obra/técnico ya se hace pasando `r.id` cuando la fila pertenece al pivot.
2. **JSX que renderiza `<NuevaVisitaDialog>` y `<VisitaDetalleSheet>`** pasa las nuevas props (`visitasSemana={visitas}`, `tecnicosByObra`, `obrasByTecnico`, `tecByUserId`).

## Archivos modificados
- `src/pages/AdminCalendario.tsx` (único archivo tocado)

## Notas de UX
- Tarjetas de técnico/obra estilo "selector grande" coherente con la directiva de la app (botones grandes, máx. 3 acciones por pantalla).
- Indicadores de disponibilidad usan los mismos verdes/naranjas/rojos que la leyenda del calendario para mantener consistencia visual.
- El aviso de solape no bloquea: el admin sigue siendo dueño de la decisión.
