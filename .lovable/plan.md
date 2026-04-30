## Causa del «Error al guardar» en Incidencias

La tabla `incidencias` en la base de datos tiene una restricción que solo permite estas categorías:

```
EPIs · orden_limpieza · altura · señalizacion · maquinaria
```

Pero la nueva sección **Incidencias** (la que muestra los botones Foto / Nota por voz / Nota) inserta cada registro con `categoria: 'general'`. Esa categoría no está permitida por la restricción, así que la base de datos rechaza la inserción y por eso aparece el toast «Error al guardar».

Confirmado revisando:

- `src/components/visita/SeccionIncidencias.tsx` líneas 82, 103, 121 → todas insertan `categoria: 'general'`.
- `pg_constraint`: `incidencias_categoria_check CHECK (categoria IN ('EPIs','orden_limpieza','altura','señalizacion','maquinaria'))`.

## Solución

Una sola migración: eliminar la restricción de categoría de la tabla `incidencias`. Las categorías quedan como texto libre, igual que ya ocurre con `amonestaciones` y `observaciones` (que no tienen este check y por eso sí guardan bien desde sus secciones equivalentes).

```sql
ALTER TABLE public.incidencias
  DROP CONSTRAINT IF EXISTS incidencias_categoria_check;
```

No hay cambios de código en el frontend ni en otras tablas. No se afectan datos existentes ni reglas de acceso (RLS).

## Mejora adicional (opcional, recomendada)

En los tres `catch` del componente, mostrar el mensaje real del error de Supabase en consola para que en el futuro este tipo de problema se diagnostique más rápido:

```ts
if (error) { console.error('Insert incidencia:', error); toast.error('Error al guardar'); return; }
```

Esto solo añade trazas, no cambia el comportamiento visible.