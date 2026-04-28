## Problema

`NuevaVisitaDialog` (en `src/pages/AdminCalendario.tsx`) hace un early return antes de llamar a `useMemo`:

```tsx
if (!ctx) return null;       // línea 406 — sale antes de hooks
const open = !!ctx;
const visitasActivas = useMemo(...)  // línea 410 — hook condicional
```

Cuando se hace clic en el `+`, `ctx` pasa de `null` a un objeto, el componente vuelve a renderizar y ejecuta un hook adicional respecto al render previo. React lanza:

> Rendered more hooks than during the previous render.

`VisitaDetalleSheet` tiene el mismo patrón (`if (!visita) return null;` en línea 670 antes de seguir), pero ahí no hay hooks después del return, así que no rompe — aunque conviene blindarlo igual.

## Arreglo

En `NuevaVisitaDialog`:
- Mover el `useMemo` (y cualquier hook) **arriba**, antes del `if (!ctx) return null;`.
- Hacer que el `useMemo` sea seguro con `ctx` posiblemente nulo (las dependencias siguen siendo `[visitasSemana]`, así que no hay problema).
- Las funciones derivadas (`visitasTecnicoDia`, `visitasTecObraSemana`, etc.) no son hooks, así que pueden quedarse después del early return sin problema, pero referencian `ctx.fecha`. Las dejo donde están — sólo se ejecutan tras pasar el guard.

Resultado: el orden de hooks (`useState` x5, `useEffect`, `useMemo`) será siempre el mismo en cada render, independientemente de si `ctx` es null o no.

## Archivos a editar

- `src/pages/AdminCalendario.tsx` — reorganizar el orden de hooks en `NuevaVisitaDialog` (y, por seguridad, el mismo patrón preventivo en `VisitaDetalleSheet`).

No se toca ninguna otra pantalla, ni la lógica de creación, ni los componentes compartidos.