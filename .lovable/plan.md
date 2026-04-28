# Rediseño del dashboard admin (`AdminInformes.tsx`)

Adapto el componente existente conservando fetching, tipos, navegación y realtime. Solo cambia la estructura visual, los filtros y el conjunto de KPIs.

## 1. KPIs superiores (4 tarjetas clicables)

Sustituyo las 4 actuales por:

| KPI | Cálculo (sobre datos ya cargados) | Color icono |
|---|---|---|
| Visitas hoy | `visitasHoy.length` (ya existe) | neutro |
| Tiempo excedido | visitas `en_progreso` cuya antigüedad desde `fecha` sea > 168h | rojo |
| Informes pendientes | `informes` con estado `pendiente_revision` | amarillo |
| Cerrados este mes | `informes` cerrados desde `startOfMonth` | verde |

- Cada tarjeta sigue siendo `<button>` con `aria-pressed`.
- La tarjeta activa se resalta con outline naranja (`ring-2 ring-primary border-primary`), sustituyendo el fondo `bg-primary/5` actual.
- Click → activa el filtro equivalente sobre **ambas columnas** (ver §3) y hace scroll a la zona de listas.

## 2. Barra de filtros (reemplaza la actual)

Una sola barra horizontal sticky encima de las dos columnas con:

- **Chips estado (única selección)**: Todos · En progreso · Pendiente revisión · Borrador.
  - Activo: `bg-[#fff7ed] border-[#fed7aa] text-[#c2410c]`.
  - Inactivo: estilo `secondary` actual.
- **Select nativo de obra** (`<select>` HTML): opciones derivadas de `obras` únicas presentes en `visitas` + `informes` (sin nueva API). Default: "Todas las obras". Cuando hay obra seleccionada distinta de "todas", el select toma el mismo estilo naranja.
- **Select de orden** a la derecha: `Tiempo ↓` (default) · `Tiempo ↑` · `Hora entrada`.
  - Aplica a la columna de visitas en progreso. Para informes, "Hora entrada" se mapea a fecha del informe; los modos de tiempo se mapean a antigüedad del informe.

El estado `activeKpi` y el chip de estado están sincronizados (KPI "Informes pendientes" → chip "Pendiente revisión", KPI "Tiempo excedido" → chip "En progreso" + filtro de tiempo, etc.).

## 3. Layout principal en 2 columnas

`grid lg:grid-cols-2 gap-6` debajo de la barra de filtros. Ambas columnas se filtran simultáneamente por estado (chip) y por obra (select), y se ordenan según el selector.

### Columna izquierda — Visitas en progreso
Lista vertical, fila compacta:
- Avatar circular con inicial del técnico.
- Línea 1: nombre del técnico (heading sm).
- Línea 2: nombre de obra (muted xs).
- Derecha: tiempo acumulado (HHh MMm) coloreado por umbral:
  - `>168h` → rojo (`text-destructive`)
  - `>72h` → naranja (`text-warning`)
  - resto → gris (`text-muted-foreground`)
- Debajo del tiempo: "Entrada HH:mm" (muted xs).
- Máx 6 filas. Si hay más: botón "Ver N más →" que expande la lista.

Si chip = "Pendiente revisión" o "Borrador", esta columna muestra estado vacío suave ("Sin visitas en progreso para este filtro").

### Columna derecha — Informes
Lista vertical, fila compacta:
- Línea 1: nombre obra.
- Línea 2: técnico · fecha (`dd MMM yyyy`).
- Derecha: pill de estado:
  - `pendiente_revision` → amarillo (`bg-warning/10 text-warning`)
  - `borrador` → gris (`bg-muted text-muted-foreground`)
  - `cerrado` → verde (`bg-success/10 text-success`)
- Mantiene `ExpedienteDot` y navegación a `/admin/informe/:id` ya existentes.

Filtro chip "En progreso" → la columna de informes se vacía (no aplica) con mensaje neutro.

## 4. Sección de alertas a ancho completo

Debajo de las dos columnas, un bloque `grid grid-cols-1 md:grid-cols-3` con bordes finos entre celdas (`divide-x`):

| Celda | Cálculo | Acción al click |
|---|---|---|
| Visitas con tiempo elevado (icono rojo) | visitas `en_progreso` con >168h | activa chip "En progreso" + orden Tiempo ↓ |
| Informes sin cerrar (icono amarillo) | informes con estado ≠ `cerrado` | activa chip "Pendiente revisión" |
| Visita hoy sin informe (icono amarillo) | visitas `finalizada` de hoy cuyo `id` no aparece en `informes[].visita_id` | activa chip "En progreso" y resalta visualmente (sin nueva navegación) |

Cada celda muestra: icono + número grande + etiqueta corta.

## Detalles técnicos

- **Sin nuevas llamadas API**: los datos de obra/técnico/visita ya están en `informes` y `visitas`. Solo añado `obra_id` al select de `visitas` (`.select('id, estado, fecha, obra_id, obras(...), profiles!...')`) y al payload del realtime equivalente, para poder filtrar por obra. Es un cambio mínimo dentro de la query existente, no una nueva llamada.
- **Lista de obras del select**: derivada con `useMemo` a partir de `visitas` + `informes` deduplicada por `obra_id`/`obra_nombre`.
- **Estado nuevo**:
  - `obraFilter: string` (default `'todas'`)
  - `sortMode: 'tiempo_desc' | 'tiempo_asc' | 'hora_entrada'` (default `'tiempo_desc'`)
  - El `activeKpi` actual se amplía a `'tiempo_excedido'` y se simplifica el mapeo KPI↔chip.
- **Helper de duración**: extraigo `minutesSince(fecha)` reutilizable para KPI "Tiempo excedido", coloreado del tiempo y orden.
- **`DurationBadge`**: se reutiliza tal cual; añado variante coloreada por umbral.
- **Bloques eliminados de la UI** (sin tocar su lógica de datos): "Actividad de hoy" completa y "Finalizadas hoy" se retiran del render porque la nueva estructura de 2 columnas + alertas las sustituye. La data sigue calculándose por si se reutiliza.
- **Realtime y navegación**: intactos.
- **Estilos**: Tailwind con tokens existentes (`primary`, `warning`, `success`, `destructive`) salvo los hex específicos pedidos para chips activos (`#fff7ed`, `#fed7aa`, `#c2410c`).

## Archivo modificado

- `src/pages/AdminInformes.tsx` (único)
