

# Plan: Dashboard de administración completo y vivo

## Problema
El dashboard actual es una lista plana de visitas y otra de informes. No transmite actividad ni da una vista general del estado del negocio. El admin necesita ver de un vistazo qué está pasando hoy, sin necesidad de editar las visitas de los técnicos.

## Solución
Rediseñar `AdminInformes.tsx` como un dashboard rico con varias secciones, y ampliar el layout para usar todo el ancho en pantallas grandes. El admin puede ver las visitas (solo lectura) pero NO editarlas — se elimina la ruta `/admin/visita/:id` y se reemplaza por una vista de detalle de solo lectura.

## Estructura del nuevo dashboard

```text
┌─────────────────────────────────────────────────────┐
│  Header (ya existe)                                 │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│  KPIs (4)     │  Visitas activas en tiempo real     │
│  Cards grid   │  (lista con pulso verde/amarillo)   │
│               │                                     │
├───────────────┴─────────────────────────────────────┤
│                                                     │
│  Actividad de hoy                                   │
│  Timeline cronológico de visitas del día             │
│  (hora, técnico, obra, estado, nº incidencias)      │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Informes (con filtros, como ahora pero mejorado)   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Cambios detallados

### 1. `AdminLayout.tsx`
- Cambiar `max-w-4xl` a `max-w-7xl` para aprovechar pantalla
- Renombrar la tab "Informes" a "Dashboard"

### 2. `AdminInformes.tsx` → Dashboard completo
**KPIs (tarjetas de resumen)** — 4 cards en grid:
- Visitas hoy (conteo de visitas con fecha = hoy)
- Visitas en progreso (conteo de visitas con estado `en_progreso`)
- Informes pendientes (conteo de informes con estado `pendiente_revision`)
- Informes cerrados este mes

**Visitas en tiempo real** — sección con realtime (ya existe, mejorar UI):
- Separar visitas "en progreso" de "finalizadas hoy"
- Cada card muestra: nombre técnico, obra, hora de inicio, duración estimada (diferencia con ahora)
- Las en progreso tienen borde pulsante naranja
- Click → navega a vista de solo lectura (`/admin/visita-detalle/:id`)

**Actividad del día** — timeline:
- Listar todas las visitas de hoy ordenadas cronológicamente
- Cada entrada: hora, avatar/iniciales del técnico, obra, estado, nº de incidencias encontradas
- Query: visitas de hoy + join con informes para contar incidencias

**Informes recientes** — como ahora pero en cards más ricas

### 3. Nueva página `AdminVisitaDetalle.tsx` (solo lectura)
- Similar a `AdminInformeDetalle` pero carga datos desde la visita (no el informe)
- Muestra: datos generales, checklist, incidencias, amonestaciones, observaciones
- Todo en modo solo lectura (sin inputs editables)
- Botón "Volver al dashboard"
- Si la visita tiene informe asociado, enlace para ir al informe

### 4. `App.tsx`
- Cambiar ruta `/admin/visita/:id` de `VisitaActiva` a `AdminVisitaDetalle`

### 5. Queries adicionales
- Conteo de incidencias por visita: `SELECT visita_id, COUNT(*) FROM informes JOIN incidencias ON ... GROUP BY visita_id`
- Visitas de hoy: filtro `fecha >= startOfToday AND fecha < startOfTomorrow`

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Ampliar max-width, renombrar tab |
| `src/pages/AdminInformes.tsx` | Rediseño completo: KPIs + visitas RT + timeline + informes |
| `src/pages/AdminVisitaDetalle.tsx` | Nuevo — vista solo lectura de una visita |
| `src/App.tsx` | Actualizar ruta `/admin/visita/:id` |

## Notas técnicas
- Se mantiene la suscripción realtime existente para visitas
- Los KPIs se calculan client-side a partir de los datos ya cargados (visitas + informes)
- La página de detalle de visita reutiliza el mismo patrón de queries que `AdminInformeDetalle`
- No se necesitan migraciones SQL

