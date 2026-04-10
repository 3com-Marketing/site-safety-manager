

# Plan: Trazabilidad completa de visitas — inicio y fin con mapa y fecha/hora

## Concepto

Estoy de acuerdo con tu enfoque. El flujo correcto es:

1. **Iniciar visita** → se graba GPS + fecha/hora de inicio (ya funciona)
2. **Trabajar en el informe** → el técnico rellena datos libremente
3. **Finalizar visita** → se graba GPS + fecha/hora de fin (el botón "Finalizar" captura esto)
4. **Editar después** → puede seguir editando el informe 7 días, pero la trazabilidad (inicio/fin) ya no cambia

Esto da una trazabilidad clara: cuánto tiempo estuvo en la obra, dónde empezó y dónde acabó. Si después edita desde casa, eso no afecta a los datos de presencia.

## Cambios

### 1. Migración: añadir `fecha_fin` a visitas
```sql
ALTER TABLE public.visitas ADD COLUMN fecha_fin timestamptz;
```
La `fecha` existente actúa como fecha de inicio. `fecha_fin` se graba al finalizar.

### 2. `VisitaActiva.tsx` — Finalizar graba fecha_fin
- Al pulsar "Finalizar", además de GPS fin, guardar `fecha_fin = now()` en el update
- Mostrar en la cabecera la duración en tiempo real (diferencia entre `fecha` y ahora) mientras la visita está en progreso

### 3. `AdminVisitaDetalle.tsx` — Mostrar trazabilidad completa
- Sección "Trazabilidad" con dos columnas:
  - **Inicio**: mapa con pin verde + fecha/hora + coordenadas
  - **Fin**: mapa con pin rojo + fecha/hora + coordenadas
- Mostrar **duración total** calculada (fecha_fin - fecha)
- Si la obra tiene coordenadas, mostrar distancia técnico↔obra en cada punto

### 4. `TechHome.tsx` / header — Tiempo en visita
- Mientras hay una visita activa, mostrar un reloj con el tiempo transcurrido desde el inicio

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Añadir columna `fecha_fin` a `visitas` |
| `src/pages/VisitaActiva.tsx` | Guardar `fecha_fin` al finalizar, mostrar duración |
| `src/pages/AdminVisitaDetalle.tsx` | Trazabilidad con inicio/fin lado a lado |

