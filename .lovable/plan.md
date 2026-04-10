

# Plan: Geocodificación de direcciones y distancia técnico-obra

## Problema
Cuando una obra tiene dirección, el mapa no la localiza automáticamente. Además, al iniciar una visita el técnico necesita ver la distancia entre su posición GPS y la ubicación de la obra.

## Solución

### 1. Geocodificación automática de direcciones en `AdminObras.tsx`
- Añadir un botón "Buscar en mapa" junto al campo de dirección
- Al pulsarlo, usar la API gratuita de **Nominatim (OpenStreetMap)** para geocodificar la dirección: `https://nominatim.openstreetmap.org/search?q={direccion}&format=json&limit=1`
- Si encuentra resultado, actualizar `latitud`/`longitud` y centrar el mapa en esa posición
- Sin coste, sin API key

### 2. Mostrar distancia técnico ↔ obra al iniciar visita (`SelectObra.tsx`)
- Cargar también `latitud` y `longitud` de cada obra en la query
- Tras obtener el GPS del técnico, antes de crear la visita, mostrar un **diálogo de confirmación** con:
  - Mini-mapa con dos pins: obra (naranja) y técnico (azul)
  - Distancia calculada con la fórmula Haversine (client-side, sin API)
  - Botón "Confirmar inicio" para proceder
- Si la obra no tiene coordenadas guardadas, saltar el paso de distancia y crear directamente

### 3. Función de distancia Haversine (utility)
- Crear `src/lib/geo.ts` con:
  - `haversineDistance(lat1, lng1, lat2, lng2): number` — devuelve metros
  - `formatDistance(meters): string` — formatea como "150 m" o "2.3 km"

### 4. Geocodificación también al crear obra desde el mapa
- En `MapPicker.tsx`, opcionalmente añadir prop `address` para auto-centrar el mapa cuando se pasa una dirección (llamando a Nominatim)

## Archivos

| Archivo | Cambio |
|---|---|
| `src/lib/geo.ts` | Nuevo — Haversine + formatDistance + geocodeAddress |
| `src/pages/AdminObras.tsx` | Botón "Buscar en mapa" que geocodifica la dirección |
| `src/pages/SelectObra.tsx` | Cargar coords de obra, mostrar distancia antes de confirmar |
| `src/components/MapPicker.tsx` | Nada (se usa tal cual con markers) |

## Notas
- Nominatim es gratuito con límite de 1 req/s — suficiente para uso admin
- Haversine es preciso a nivel práctico (error < 0.5% en distancias cortas)
- No se necesitan migraciones SQL

