# Calendario semanal de visitas

Nueva pantalla aislada en `/admin/calendario` con vista de semana, pivot obra/técnico, modal de creación y panel lateral de detalle. No se modifica ninguna pantalla ni componente existente.

## Layout

```text
┌────────────────────────────────────────────────────────────────────────┐
│  ‹  Semana 18 · 27 abr – 3 may  ›    [Hoy]    [Por obra ▼ Filtro ▼]   │
│                                                                        │
│  ● Realizada   ● Programada   ● Pendiente confirmar                    │
│                                                                        │
│  ┌────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │ Obra   │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │                │
│  ├────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤                │
│  │ Obra A │ ▣JL │     │ ▣MR │     │ ▣JL │     │     │                │
│  │ tec... │     │     │     │     │     │     │     │                │
│  └────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘                │
└────────────────────────────────────────────────────────────────────────┘
```

- Cabecera con flechas ‹ ›, etiqueta "Semana N · dd MMM – dd MMM" en español, botón **Hoy**.
- Toggle pivot `Por obra` / `Por técnico` con el mismo estilo activo naranja (`bg-primary text-primary-foreground`) ya usado en chips de filtro.
- Desplegable contextual (`Select`) que cambia su contenido según el modo: lista de obras o lista de técnicos.
- Leyenda de colores encima de la tabla.
- Columna izquierda fija de 170px con nombre principal + subtexto secundario (técnicos asignados o obras asignadas, truncado).
- Día actual con fondo `bg-orange-50` (naranja muy suave coherente con el resto de la app).
- Chips coloreados por estado:
  - Verde `bg-green-100 text-green-800` → realizada
  - Azul `bg-blue-100 text-blue-800` → programada
  - Amarillo `bg-yellow-100 text-yellow-800` → pendiente de confirmar
- Tooltip en hover con nombre completo (técnico u obra según modo).

## Interacciones

- **Clic en nombre de obra** → `navigate('/admin/obras')` (la ficha por ID no existe; se usa la ruta de listado existente).
- **Clic en nombre de técnico** → `navigate('/admin/tecnicos')`.
- **Clic en celda vacía** → abre `Dialog` "Nueva visita" con fecha precargada y selectores de obra y técnico.
- **Clic en chip existente** → abre `Sheet` lateral derecho con detalle de la visita y acciones Editar / Cancelar (sin abandonar el calendario).

## Aclaración importante sobre los datos

El esquema actual de `visitas.estado` solo guarda `en_progreso` y `finalizada`. Para los tres estados pedidos (realizada / programada / pendiente confirmar) hay dos opciones:

1. **Recomendado**: ampliar `visitas.estado` con dos valores nuevos `programada` y `pendiente_confirmar`, manteniendo retrocompatibilidad. Mapeo visual:
   - `finalizada` → verde (realizada)
   - `programada` → azul
   - `pendiente_confirmar` → amarillo
   - `en_progreso` → verde con borde animado (visita activa hoy)
2. **Sin tocar BD**: mostrar solo dos colores reales (verde finalizada / azul en_progreso) y dejar el amarillo como placeholder vacío hasta que decidas el modelo.

El plan asume la opción 1 (migración no destructiva, solo añade valores aceptados).

## Cambios técnicos

### Migración SQL
- Si `visitas.estado` es columna `text`: no hace falta cambio de tipo, basta con permitir los nuevos valores en la app. No hay CHECK constraint a tocar.
- Añadir índice `CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON visitas(fecha);` para acelerar consultas semanales.

### Nuevo archivo `src/pages/AdminCalendario.tsx`
- Estado: `weekStart` (lunes), `pivot: 'obra' | 'tecnico'`, `filtroId: string | 'todos'`, `selectedVisita`, `nuevaVisitaCtx`.
- Carga en paralelo con `Promise.all`:
  - `obras` con `clientes(nombre)`
  - `tecnicos` (id, nombre, apellidos)
  - `tecnicos_obras` (mapa N:N)
  - `visitas` filtradas por `fecha >= weekStart AND fecha < weekStart+7d`, con join a `obras(nombre)` y `tecnicos` vía `usuario_id` → `tecnicos.user_id`.
- Construye matriz `filas × 7 días` en `useMemo`, agrupando visitas por (filaId, díaIndex).
- `date-fns` con locale `es` para semanas ISO (lunes inicio) y `getISOWeek` para "Semana N".

### Nuevos sub-componentes (dentro del mismo archivo, sin tocar `src/components/`)
- `<LegendChips />`
- `<WeekHeader />` flechas + Hoy + label
- `<PivotToggle />`
- `<CalendarGrid />` tabla de 8 columnas
- `<VisitaChip />` con `Tooltip` (usa `@/components/ui/tooltip` ya existente)
- `<NuevaVisitaDialog />` con `Dialog` + selects de obra y técnico, fecha precargada
- `<VisitaDetalleSheet />` con `Sheet` lateral derecho (`side="right"`), botones Editar/Cancelar

### Ruta nueva en `src/App.tsx`
- Añadir `<Route path="/admin/calendario" element={<AdminCalendario />} />`.

### Nuevo tab en `src/components/admin/AdminLayout.tsx`
- Añadir entrada `{ path: '/admin/calendario', label: 'Calendario', icon: CalendarDays }` al array `TABS`. Es el único cambio en componente compartido y es estrictamente aditivo (no altera comportamiento existente). Si prefieres cero cambios fuera del archivo nuevo, lo omitimos y el acceso es sólo por URL directa.

### Acciones soportadas en el panel lateral
- **Editar**: cambiar fecha, técnico, obra, estado.
- **Cancelar**: `UPDATE visitas SET estado='pendiente_confirmar'` o `DELETE` (a confirmar contigo). Las RLS actuales permiten al admin actualizar cualquier visita (`Users can update own visitas` incluye `has_role(admin)`). No hay política DELETE, así que "cancelar" será un cambio de estado, no borrado.

## Archivos

- **Nuevo**: `src/pages/AdminCalendario.tsx`
- **Editado** (1 línea): `src/App.tsx` — añadir la ruta
- **Editado** (1 entrada en array): `src/components/admin/AdminLayout.tsx` — añadir tab Calendario
- **Migración**: índice en `visitas.fecha`

## Preguntas a confirmar antes de implementar

1. ¿Apruebas ampliar los estados de visita a `programada` y `pendiente_confirmar`? (necesario para los 3 colores pedidos)
2. ¿"Cancelar" desde el panel lateral debe borrar la visita o cambiarla a un estado tipo `cancelada`? (recomiendo añadir estado `cancelada` y filtrarla del calendario)
3. ¿Añado el tab "Calendario" al menú admin o prefieres acceso solo por URL?
