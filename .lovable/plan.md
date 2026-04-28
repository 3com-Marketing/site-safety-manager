## Objetivo

Convertir las 4 tarjetas del dashboard de admin (`/admin`) en botones clicables que filtren la información mostrada debajo según el KPI seleccionado.

## Comportamiento por tarjeta

| Tarjeta | Al hacer clic |
|---|---|
| **Visitas hoy** | Hace scroll a la sección "Actividad de hoy" y la resalta. |
| **En progreso** | Hace scroll a la sección "Visitas en progreso" y la resalta. |
| **Informes pendientes** | Hace scroll a "Informes" y aplica el filtro `pendiente_revision`. |
| **Cerrados este mes** | Hace scroll a "Informes" y aplica el filtro `cerrado` (mostrando solo los del mes actual). |

Comportamiento adicional:
- Pulsar la tarjeta ya activa la deselecciona (vuelve a "Todos" / sin filtro).
- La tarjeta seleccionada se marca visualmente con un borde primario y fondo sutil.
- En las tarjetas de visitas, si el listado correspondiente está vacío se muestra un estado vacío en lugar de ocultarse.

## Cambios técnicos

Archivo: `src/pages/AdminInformes.tsx`

1. Añadir estado `activeKpi: 'visitas_hoy' | 'en_progreso' | 'pendientes' | 'cerrados_mes' | null`.
2. Envolver cada `<Card>` KPI en un `<button>` (o convertir Card en clicable con `role="button"`, `onClick`, `tabIndex`, `aria-pressed`) con clase condicional `border-primary bg-primary/5` cuando esté activa.
3. Añadir `ref`s a las secciones "Visitas en progreso", "Actividad de hoy" e "Informes" y hacer `scrollIntoView({ behavior: 'smooth', block: 'start' })` al activar el KPI correspondiente.
4. Para los KPIs de informes, además de hacer scroll, actualizar `setFilter('pendiente_revision' | 'cerrado')`.
5. Para "Cerrados este mes", filtrar adicionalmente la lista de informes al mes actual cuando `activeKpi === 'cerrados_mes'` (extender `filtered` con un check de fecha ≥ `monthStart`).
6. Mantener el comportamiento existente de los chips de filtro (Todos / Pendiente / Borrador / Cerrado); al pulsar un chip se limpia `activeKpi` para evitar conflictos.

## Accesibilidad

- `aria-pressed={activeKpi === '...'}` en cada tarjeta.
- `cursor-pointer` y `transition-colors` para feedback visual.
- Foco visible (`focus-visible:ring-2 focus-visible:ring-primary`).
