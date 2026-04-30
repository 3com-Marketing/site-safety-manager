# Trazabilidad geográfica en el detalle de informe (admin)

## Problema

En `/admin/informe/:id` (página `AdminInformeDetalle.tsx`) no aparece la sección de **Trazabilidad geográfica** (mapas de inicio/fin, coordenadas, duración, distancia a la obra). Esa información sí existe en `/admin/visita/:id` (`AdminVisitaDetalle.tsx`), pero el flujo de revisión de informes pendientes entra por el detalle de informe, no por el de visita, así que el revisor no la ve.

Los datos están disponibles en la tabla `visitas` (`lat_inicio`, `lng_inicio`, `lat_fin`, `lng_fin`, `fecha`, `fecha_fin`) y en `obras` (`latitud`, `longitud`), pero `AdminInformeDetalle` actualmente solo carga `visitas(id, obras(nombre), profiles(nombre))`.

## Solución

Replicar el bloque "Trazabilidad" de `AdminVisitaDetalle` dentro de `AdminInformeDetalle`, justo encima de "Datos Generales".

### Cambios en `src/pages/AdminInformeDetalle.tsx`

1. **Ampliar el SELECT** del informe para traer también los campos GPS y temporales de la visita y las coordenadas de la obra:
   ```
   visitas(
     id, fecha, fecha_fin,
     lat_inicio, lng_inicio, lat_fin, lng_fin,
     obras(nombre, latitud, longitud)
   )
   ```

2. **Añadir imports**:
   - `MapPin`, `Clock` de `lucide-react`
   - `differenceInMinutes`, `differenceInHours` de `date-fns`
   - `MapPicker` desde `@/components/MapPicker`
   - `haversineDistance`, `formatDistance` desde `@/lib/geo`

3. **Renderizar un `<Collapsible defaultOpen>`** "Trazabilidad" antes de "Datos Generales", con la misma estructura que en `AdminVisitaDetalle`:
   - Tarjeta de duración total (si hay `fecha` + `fecha_fin`).
   - Dos columnas (Inicio / Fin) cada una con: timestamp formateado, `MapPicker` readOnly mostrando marcador del punto + marcador de la obra, coordenadas en texto pequeño y distancia a la obra (`haversineDistance` + `formatDistance`).
   - Mensajes "Sin coordenadas GPS" / "Visita no finalizada" para los casos sin datos.

4. **Sin cambios** en lógica de guardado, firma ni edición. Solo lectura.

## Detalles técnicos

- Reutilizamos componentes ya existentes (`MapPicker`, helpers de `lib/geo`), por lo que no se añaden dependencias.
- La sección es de solo lectura, no afecta a las RLS ni al schema.
- No se toca `AdminVisitaDetalle`.

## Resultado esperado

Al abrir un informe pendiente desde el listado de admin, el revisor verá la trazabilidad geográfica (mapas inicio/fin, distancia a la obra y duración) en la parte superior, antes de los Datos Generales.
