# Mapa de confirmación al iniciar y finalizar visita

## Objetivo

1. Al **iniciar** visita: invertir el mapa de confirmación actual para que la ubicación del técnico sea la principal (mapa centrado en el técnico) y la obra sea el marcador de referencia para medir distancia.
2. Al **finalizar** visita: mostrar el **mismo** diálogo de confirmación con mapa antes de cerrarla, en lugar del actual diálogo silencioso de "obteniendo ubicación".

## Cambios

### 1. `src/pages/SelectObra.tsx` — invertir el mapa de inicio

En el bloque `confirmState`, cambiar el `MapPicker` para centrarlo en la ubicación del técnico:

- `lat={confirmState.lat}` y `lng={confirmState.lng}` (en lugar de `obraLat`/`obraLng`).
- Mantener ambos marcadores (obra naranja, técnico azul) tal como están, así el usuario ve primero su posición y puede desplazar el mapa hasta la obra para verificar la distancia.
- El badge inferior con `formatDistance(confirmState.distance)` se mantiene igual.

No cambia la lógica de cálculo de distancia ni el botón "Confirmar inicio".

### 2. `src/pages/VisitaActiva.tsx` — añadir confirmación con mapa al finalizar

Reemplazar el flujo actual de `finishVisita` (que solo muestra un loader) por un flujo en dos pasos análogo al de inicio:

**Nuevo estado:**
```ts
type FinishGeoState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'error'; kind: 'denied' | 'timeout' | 'unavailable' }
  | { status: 'confirm'; lat: number; lng: number; obraLat: number | null; obraLng: number | null; distance: number | null }
  | { status: 'saving'; lat: number | null; lng: number | null };
```

**Cargar coordenadas de la obra** en `fetchData` (extender el select de `visitas` para incluir `obras(nombre, latitud, longitud)`) y guardarlas en estado.

**Flujo nuevo de `finishVisita`:**
1. Pulsar "FINALIZAR VISITA" → pedir geolocalización (`enableHighAccuracy`, timeout 15s) mostrando diálogo "Obteniendo ubicación" con botones **Cancelar** y **Continuar sin ubicación**.
2. Al obtener posición:
   - Si la obra tiene coordenadas → calcular `haversineDistance` y abrir diálogo de confirmación con mapa (mismo componente visual que `SelectObra`: mapa centrado en el técnico, marcador naranja para la obra, marcador azul para el técnico, badge de distancia).
   - Si la obra no tiene coordenadas → guardar directamente sin confirmación.
3. En caso de error de GPS → diálogo con opciones **Reintentar** y **Continuar sin ubicación** (mismo patrón que `SelectObra`).
4. Botones del diálogo de confirmación: **Cancelar** (vuelve a la visita sin finalizar) y **Confirmar fin de visita** (ejecuta el `update` de `visitas` + `informes` y navega).

**Mover lógica de persistencia** a una función `persistFinish(lat, lng)` que haga los dos `update` actuales y la navegación.

### 3. Pequeña refactorización opcional

Los tres diálogos (requesting/error/confirm) son prácticamente idénticos a los de `SelectObra`. Para no duplicar JSX, los inlineamos en `VisitaActiva.tsx` reutilizando `MapPicker`, `haversineDistance` y `formatDistance` (ya existen). No se extrae componente compartido en este cambio para mantener el diff pequeño.

## Archivos a modificar

- `src/pages/SelectObra.tsx` — invertir centro del mapa de confirmación.
- `src/pages/VisitaActiva.tsx` — cargar coords de obra, sustituir `finishVisita` por flujo con diálogos GPS + mapa de confirmación.

## Detalles técnicos

- `MapPicker` con `lat`/`lng` define el centro y el zoom inicial; los `markers` se pintan independientemente, así que centrar en el técnico no afecta a la visualización de ambos puntos.
- Se reutiliza `haversineDistance` y `formatDistance` de `src/lib/geo.ts`.
- El `update` a `visitas` al finalizar mantiene los mismos campos (`estado`, `lat_fin`, `lng_fin`, `fecha_fin`); solo se difiere hasta que el usuario confirme en el mapa.
- Modo admin (`isAdminMode`) no muestra el botón finalizar, así que no se ve afectado.
