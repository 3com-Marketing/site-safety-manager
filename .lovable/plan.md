

# Plan: Mejorar importación en FormInforme

## Cambio

Reescribir la lógica de importación en `FormInforme.tsx`:

1. **Cambiar la query** para buscar la última visita **finalizada** (`estado = 'finalizada'`), ordenada por `fecha_fin DESC`. Además de los `checklist_bloques` con anotaciones, obtener también `notas_generales` del informe y la `fecha` de la visita para el toast.

2. **Actualizar `CATEGORY_MAP`** con las categorías reales de la BD:
   - `'EPIs'` → `'epi'`
   - `'orden_limpieza'` → `'orden_limpieza'`
   - `'altura'` → `'trabajos_altura'`
   - `'señalizacion'` → `'senalizacion'`
   - `'maquinaria'` → `'maquinaria'`

3. **Cambiar `handleImport`** a función async que ejecuta la query on-demand (en lugar de depender de `useQuery` precargada):
   - Si no encuentra visita finalizada → `toast.error("No hay visitas finalizadas para esta obra")`
   - Si tiene éxito → mapear bloques (estado + anotaciones concatenados con salto de línea), `notas_generales` → `estado_general`, y mostrar `toast.success("Datos importados desde la visita del [fecha]")`

4. **El botón siempre se muestra** cuando es creación (`!documento`) y hay `effectiveObraId`, sin esperar a que la query precargue datos.

5. Añadir `import { toast } from 'sonner'`.

## Archivo afectado
- `src/components/documentos/formularios/FormInforme.tsx`

