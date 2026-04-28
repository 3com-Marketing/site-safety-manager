## Cambios en el dashboard admin (`AdminInformes.tsx`)

Dos ajustes pequeños sobre la lista de visitas y la lista de informes. Sin tocar fetching, tipos, navegación ni filtros.

### 1. Informes — limitar la lista

Hoy `informesFiltrados.map(...)` pinta todos los informes sin tope, igual que antes existía en visitas.

- Aplicar el **mismo patrón que ya usa la columna de visitas**: mostrar 6 por defecto y un botón "Ver N más →" para expandir.
- Nuevo estado: `showAllInformes` (boolean, default `false`).
- Calcular `informesMostrados = showAllInformes ? informesFiltrados : informesFiltrados.slice(0, 6)` y `informesRestantes`.
- Cuando se cambia cualquier filtro (chip estado, obra, KPI, alerta), resetear `showAllInformes` a `false` para que al filtrar la lista vuelva a estar plegada (mismo trato que conviene aplicar también a `showAllVisitas`, que actualmente no se resetea).

### 2. Visitas en progreso — botón para volver a colapsar

Cuando el usuario pulsa "Ver N más →" la lista se expande pero no hay forma de plegarla otra vez.

- Si `showAllVisitas === true` y `visitasFiltradas.length > 6`, mostrar al pie de la lista un botón **"Mostrar menos ↑"** que ponga `showAllVisitas` a `false` y haga scroll suave a `listsRef` para que la cabecera de filtros quede visible.
- Mismo botón equivalente al pie de la lista de informes cuando estén expandidos.

### Detalles técnicos

- Solo se edita `src/pages/AdminInformes.tsx`.
- Estado nuevo: `const [showAllInformes, setShowAllInformes] = useState(false);`
- Reset en los `setEstadoChip` / `setObraFilter` / `handleKpiClick` / `handleAlertClick` existentes: añadir `setShowAllVisitas(false); setShowAllInformes(false);`.
- Botones "Ver N más" y "Mostrar menos" comparten el estilo actual (`w-full text-sm text-primary font-medium py-2 hover:underline`).
- No se cambian queries Supabase, realtime, KPIs, alertas ni layout general.
