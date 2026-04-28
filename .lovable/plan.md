## Añadir filtro "Cerrado" en el dashboard admin

Hoy en `src/pages/AdminInformes.tsx` los chips de estado son: **Todos · En progreso · Pendiente revisión · Borrador**. Falta **Cerrado**, así que un informe ya cerrado solo se ve mezclado dentro de "Todos" y no se puede aislar. El KPI "Cerrados este mes" cuenta pero no filtra la lista.

### Cambios

1. **Nuevo chip "Cerrado"** en la barra de filtros, a la derecha de "Borrador". Mismo estilo que el resto, color activo naranja.

2. **Lógica de filtrado de informes**: añadir la rama para `estadoChip === 'cerrado'` que filtre `informes` por `estado === 'cerrado'`.

3. **Columna de visitas cuando el chip es "Cerrado"**: ocultarla (devolver `[]`), igual que ya se hace con "Pendiente revisión" y "Borrador". Una visita en progreso no puede tener informe cerrado, así que tiene sentido vaciar esa columna y dejar al usuario centrado en los informes cerrados.

4. **KPI "Cerrados este mes"**: al hacer clic, además de marcarse como activo, activar el chip `cerrado` automáticamente (igual que "Informes pendientes" activa hoy `pendiente_revision`). Así el KPI y la lista quedan sincronizados.

5. **Mensaje vacío**: ajustar el texto de "No hay informes" para cubrir también el caso `cerrado` (no se necesita un mensaje especial, el actual sirve).

### Detalles técnicos

- Editar solo `src/pages/AdminInformes.tsx`.
- Tipo `EstadoChip` pasa a aceptar `'cerrado'`.
- Array `ESTADO_CHIPS` añade `{ value: 'cerrado', label: 'Cerrado' }`.
- En el `useMemo` de `visitasFiltradas`: la condición que ya descarta `pendiente_revision` y `borrador` se amplía a `cerrado`.
- En el `useMemo` de `informesFiltrados`: añadir `else if (estadoChip === 'cerrado') base = base.filter(i => i.estado === 'cerrado');`.
- En `handleKpiClick('cerrados_mes')`: añadir `setEstadoChip('cerrado')` y `setSortMode('tiempo_desc')` o el orden que ya use ese KPI.
- No se tocan queries, RLS, realtime, KPIs de la barra superior, alertas ni el resto del layout.
