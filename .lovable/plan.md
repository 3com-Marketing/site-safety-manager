

# Plan: Ubicación en mapa para obras y geolocalización de visitas

## Resumen
1. Añadir coordenadas (latitud/longitud) a la tabla `obras` para situar cada obra en un mapa.
2. Añadir coordenadas de inicio y fin a la tabla `visitas` para registrar dónde estaba el técnico al empezar y al acabar.
3. Mostrar mapa en la gestión de obras (admin) y solicitar ubicación GPS al técnico al iniciar y finalizar una visita.

## Cambios en base de datos

### Migración 1: Columnas de geolocalización
```sql
-- Obras: ubicación fija de la obra
ALTER TABLE public.obras ADD COLUMN latitud double precision;
ALTER TABLE public.obras ADD COLUMN longitud double precision;

-- Visitas: ubicación del técnico al iniciar y finalizar
ALTER TABLE public.visitas ADD COLUMN lat_inicio double precision;
ALTER TABLE public.visitas ADD COLUMN lng_inicio double precision;
ALTER TABLE public.visitas ADD COLUMN lat_fin double precision;
ALTER TABLE public.visitas ADD COLUMN lng_fin double precision;
```

## Cambios en frontend

### 1. Componente `MapPicker.tsx` (nuevo)
- Componente reutilizable con Leaflet (libre, sin API key)
- Props: `lat`, `lng`, `onSelect(lat, lng)`, `readOnly`
- Modo editable: click en mapa para poner pin
- Modo solo lectura: muestra pin fijo
- Usa tiles de OpenStreetMap

### 2. `AdminObras.tsx` — Mapa en ficha de obra
- En el diálogo de crear/editar obra: añadir `MapPicker` para seleccionar ubicación
- En el diálogo de ver obra: mostrar mapa en solo lectura
- Guardar `latitud` y `longitud` en la obra

### 3. `SelectObra.tsx` — Captura de ubicación al iniciar visita
- Al seleccionar una obra, antes de crear la visita, pedir `navigator.geolocation.getCurrentPosition()`
- Mostrar un diálogo/paso intermedio: "Obteniendo tu ubicación..." con spinner
- Si el usuario deniega GPS, mostrar aviso pero permitir continuar (campos quedan null)
- Guardar `lat_inicio` y `lng_inicio` en la visita al hacer el insert

### 4. `VisitaActiva.tsx` — Captura de ubicación al finalizar
- En `finishVisita()`, antes de actualizar estado, pedir geolocalización
- Guardar `lat_fin` y `lng_fin` en la visita con el update
- Mostrar "Obteniendo ubicación de cierre..." brevemente

### 5. `AdminInformes.tsx` / `AdminVisitaDetalle.tsx` — Visualización
- En la vista de detalle de visita del admin, mostrar mini-mapa con los pins de inicio y fin
- En el dashboard, opcionalmente mostrar icono de ubicación si hay coordenadas

## Dependencias
- `leaflet` + `react-leaflet` (npm) — mapas gratuitos con OpenStreetMap
- API nativa `navigator.geolocation` del navegador — sin coste

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Añadir columnas lat/lng a `obras` y `visitas` |
| `package.json` | Añadir `leaflet`, `react-leaflet`, `@types/leaflet` |
| `src/components/MapPicker.tsx` | Nuevo componente de mapa interactivo |
| `src/pages/AdminObras.tsx` | Mapa en crear/editar/ver obra |
| `src/pages/SelectObra.tsx` | Captura GPS al iniciar visita |
| `src/pages/VisitaActiva.tsx` | Captura GPS al finalizar visita |
| `src/pages/AdminVisitaDetalle.tsx` | Mini-mapa con pins inicio/fin |

