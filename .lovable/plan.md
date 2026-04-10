

# Plan: Etiquetado automático de fotos

## Problema
Las fotos no tienen contexto: no se sabe de qué sección son, ni su orden, ni la fecha/hora, ni la obra. En el informe final esto genera confusión.

## Solución
Añadir un campo `etiqueta` a las tablas que almacenan fotos (`anotaciones`, `fotos`, `amonestaciones`, `observaciones`) que se genera automáticamente al subir la foto, con formato:

```
EPIs - Foto 3 | Obra Residencial Norte | 10 abr 2026, 14:32
```

La etiqueta se compone de:
- **Sección/bloque**: "EPIs", "Incidencias", "Amonestaciones", "Observaciones"
- **Número secuencial**: calculado contando las fotos existentes en esa sección +1
- **Nombre de la obra**: obtenido de la visita
- **Fecha y hora**: momento de captura

## Cambios

### 1. Migración: añadir columna `etiqueta`
```sql
ALTER TABLE anotaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE fotos ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE amonestaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';
ALTER TABLE observaciones ADD COLUMN etiqueta text NOT NULL DEFAULT '';
```

### 2. `VisitaActiva.tsx`
- Cargar el nombre de la obra al inicio (ya tiene `obra_id` de la visita) y pasarlo como prop `obraNombre` a todos los componentes de sección y a `ChecklistBloque`.

### 3. `ChecklistBloque.tsx`
- Recibir prop `obraNombre`.
- Al subir foto: contar anotaciones con foto existentes en ese bloque, generar etiqueta `"{categoriaLabel} - Foto {n} | {obraNombre} | {fecha}"` y guardarla en el insert.
- Mostrar la etiqueta debajo de cada foto como pie de foto (`text-xs text-muted-foreground`).

### 4. `SeccionIncidencias.tsx`
- Recibir prop `obraNombre`.
- Al subir foto: contar fotos existentes en incidencias del mismo informe, generar etiqueta `"Incidencias - Foto {n} | {obraNombre} | {fecha}"`.
- Mostrar etiqueta a pie de foto.

### 5. `SeccionAmonestaciones.tsx`
- Recibir prop `obraNombre`.
- Misma lógica: `"Amonestaciones - Foto {n} | {obraNombre} | {fecha}"`.

### 6. `SeccionObservaciones.tsx`
- Recibir prop `obraNombre`.
- Misma lógica: `"Observaciones - Foto {n} | {obraNombre} | {fecha}"`.

### 7. UI de pie de foto (en los 4 componentes)
Debajo de cada `<img>`, si hay etiqueta, mostrar:
```html
<p class="text-[11px] text-muted-foreground text-center mt-1 italic">{etiqueta}</p>
```

## Archivos modificados
| Archivo | Cambio |
|---|---|
| Migración SQL | Añadir columna `etiqueta` a 4 tablas |
| `src/pages/VisitaActiva.tsx` | Cargar nombre de obra, pasarlo como prop |
| `src/components/visita/ChecklistBloque.tsx` | Generar etiqueta al subir foto, mostrar pie de foto |
| `src/components/visita/SeccionIncidencias.tsx` | Generar etiqueta, mostrar pie de foto |
| `src/components/visita/SeccionAmonestaciones.tsx` | Generar etiqueta, mostrar pie de foto |
| `src/components/visita/SeccionObservaciones.tsx` | Generar etiqueta, mostrar pie de foto |

