# Filtro por Técnico/Coordinador en el Dashboard

## Problema

En `/admin` (página `AdminInformes.tsx`) ya existe un desplegable de **Obra**, pero no hay forma de filtrar por **técnico/coordinador**. El admin necesita poder seleccionar a un técnico y ver únicamente las obras de su portfolio (las que tiene asignadas en `tecnicos_obras`), junto con las visitas e informes asociados.

## Solución

Añadir un nuevo `<select>` "Técnico" en la barra de filtros, justo al lado del de "Obras", con el mismo estilo (chip naranja cuando está activo). Cuando se selecciona un técnico:

1. El desplegable de **Obras** se reduce automáticamente a las obras del portfolio de ese técnico (tabla `tecnicos_obras`).
2. Las listas de **Visitas en progreso** e **Informes** se filtran para mostrar solo las correspondientes a esas obras.
3. La opción "Todos los técnicos" restaura el comportamiento actual.

## Cambios en `src/pages/AdminInformes.tsx`

1. **Cargar técnicos y sus asignaciones** en el `useEffect` de fetch inicial:
   - `supabase.from('tecnicos').select('id, nombre, apellidos').order('nombre')`
   - `supabase.from('tecnicos_obras').select('tecnico_id, obra_id')` para construir un mapa `tecnicoId → Set<obraId>`.

2. **Nuevo estado**: `tecnicoFilter` (`string`, default `'todos'`), `tecnicos` y `tecnicoObrasMap`.

3. **Nuevo `useMemo` `obrasDelTecnico`**: si `tecnicoFilter !== 'todos'`, devuelve el `Set<obraId>` del técnico; en otro caso `null`.

4. **Ajustar `obrasOptions`**: si hay técnico seleccionado, filtrar las opciones a solo las obras de ese técnico.

5. **Ajustar `visitasFiltradas` e `informesFiltrados`**: añadir un filtro extra `if (obrasDelTecnico) base = base.filter(x => x.obra_id && obrasDelTecnico.has(x.obra_id))`.

6. **Resetear `obraFilter` a `'todas'`** automáticamente cuando cambie `tecnicoFilter`, para evitar combinaciones imposibles (obra que no pertenece al técnico).

7. **Render del desplegable** en la barra de filtros (línea ~484, antes del select de obras):
   ```tsx
   <select
     value={tecnicoFilter}
     onChange={(e) => { setTecnicoFilter(e.target.value); setActiveKpi(null); }}
     className={tecnicoSelectClass}
   >
     <option value="todos">Todos los técnicos</option>
     {tecnicos.map(t => (
       <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>
     ))}
   </select>
   ```
   Con la misma clase chip que el de obras (naranja cuando activo).

## Detalles técnicos

- No se tocan tablas, RLS ni schema. Solo lectura.
- `tecnicos_obras` ya es legible por `authenticated` (policy "Authenticated can view tecnicos_obras").
- El filtro es client-side sobre los datos ya cargados, igual que el de obras actual; no añade peticiones extra durante la interacción.
- Se mantiene el realtime de visitas (no afectado).

## Resultado esperado

En el dashboard `/admin`, junto al filtro "Todas las obras" aparece un nuevo selector "Todos los técnicos". Al elegir un técnico, las obras del desplegable y las listas de visitas/informes se reducen al portfolio de ese técnico.
