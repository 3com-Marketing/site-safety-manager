

# Plan: Fecha y hora siempre visible a pie de foto

## Problema
Las fotos no siempre muestran la fecha y hora. Solo se muestra cuando existe el campo `etiqueta`, que es opcional. La fecha/hora debe aparecer siempre debajo de cada foto, tanto en la app como en el PDF generado.

## Cambios

### 1. Componentes de visita — añadir fecha/hora a pie de foto
En todos los componentes que muestran fotos, añadir siempre un pie de foto con `created_at` formateado como `dd MMM yyyy, HH:mm`:

- **`ChecklistBloque.tsx`** (línea ~144): Debajo de cada `<img>` de anotación, mostrar siempre `format(new Date(a.created_at), "dd MMM yyyy, HH:mm")` como pie de foto, independientemente de si tiene `etiqueta`
- **`SeccionIncidencias.tsx`** (línea ~178): Debajo de cada foto de incidencia, usar `created_at` de la foto. Como `fotos` tiene su propio `created_at`, añadirlo al select y mostrarlo
- **`SeccionAmonestaciones.tsx`** (línea ~219): Debajo de la foto, mostrar `created_at` del registro
- **`SeccionObservaciones.tsx`** (línea ~168): Debajo de la foto, mostrar `created_at` del registro

El formato será consistente en todas:
```
📅 10 abr 2026, 14:35
```

### 2. Query de fotos en incidencias
En `SeccionIncidencias.tsx`, el select de fotos es `fotos(id, url, etiqueta)` — añadir `created_at`:
```typescript
.select('..., fotos(id, url, etiqueta, created_at)')
```

### 3. PDF (`generar-pdf/index.ts`)
Añadir pie de foto con fecha/hora en el HTML generado:
- En anotaciones del checklist: debajo de `<img>`, añadir `<p class="foto-caption">${fecha}</p>`
- En fotos de incidencias: igual
- En amonestaciones con foto: igual
- En observaciones con foto: igual

Añadir estilo CSS `.foto-caption` al PDF:
```css
.foto-caption { font-size: 8pt; color: #666; text-align: center; margin-top: 2pt; }
```

### 4. Vista de detalle admin (`AdminVisitaDetalle.tsx`)
Verificar que también muestre fecha/hora a pie de foto en la vista solo lectura.

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/visita/ChecklistBloque.tsx` | Pie de foto con fecha/hora siempre |
| `src/components/visita/SeccionIncidencias.tsx` | Añadir `created_at` al select de fotos + pie de foto |
| `src/components/visita/SeccionAmonestaciones.tsx` | Pie de foto con fecha/hora siempre |
| `src/components/visita/SeccionObservaciones.tsx` | Pie de foto con fecha/hora siempre |
| `src/pages/AdminVisitaDetalle.tsx` | Pie de foto en vista solo lectura |
| `supabase/functions/generar-pdf/index.ts` | Pie de foto con fecha/hora en PDF |

