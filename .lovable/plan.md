

# Plan: Paso 9 — Integración de documentos en vistas existentes

## Resumen

Crear un helper reutilizable para calcular el estado del expediente documental (semáforo 🔴🟡🟢), e integrarlo en 3 vistas: AdminObras, AdminInformes y TechHome.

## 1. Nuevo archivo: `src/lib/expedienteStatus.ts`

Función pura que recibe un array de documentos y retorna el estado del expediente:

```text
Inputs: documentos[], tipoObra ('sin_proyecto' | 'con_proyecto')
Output: 'rojo' | 'amarillo' | 'verde' | 'sin_datos'

Lógica:
- Docs obligatorios sin_proyecto: ['acta_nombramiento_cae']
- Docs obligatorios con_proyecto: ['acta_nombramiento_proyecto', 'acta_aprobacion_plan_sys']
- Si algún obligatorio está en 'pendiente' o falta → rojo
- Si todos obligatorios están generados/adjuntados pero ninguno firmado → amarillo
- Si todos obligatorios están firmados → verde
```

Como la tabla `obras` no tiene campo `tipo_obra`, la función inferirá el tipo a partir de los documentos existentes: si hay `acta_nombramiento_proyecto` → con_proyecto, si hay `acta_nombramiento_cae` → sin_proyecto. Si no hay ninguno, default a sin_proyecto (solo necesita 1 doc obligatorio).

## 2. `AdminObras.tsx` — Sección Documentación en el dialog de vista

En el dialog "Ficha de la obra" (`viewObra`):
- Añadir `<DocumentosList obraId={viewObra.id} />` debajo de los datos existentes
- En la lista de obras, añadir un indicador (dot coloreado) junto al nombre de cada obra. Esto requiere una query adicional al montar la página que traiga los documentos agrupados por obra_id para calcular el semáforo de cada una.

Query adicional en `fetchData`:
```sql
SELECT obra_id, tipo, estado FROM documentos_obra
```
Procesamos en el cliente para generar un `Map<obraId, 'rojo'|'amarillo'|'verde'>`.

## 3. `AdminInformes.tsx` — Columna "Docs" en informes

- Añadir la misma query de documentos por obra al `fetchAll`
- Extraer el `obra_id` de cada informe (via `visitas.obra_id` — necesita añadir `obra_id` al select de visitas)
- Mostrar un dot coloreado en cada fila de informe

## 4. `TechHome.tsx` — Sección "Documentos pendientes"

- Nueva query: documentos en estado `pendiente` o `generado` cuyo tipo sea de rol `tecnico` o `ambos` (reuniones e informes), filtrados por las obras asignadas al técnico
- Query: `documentos_obra` where `tipo in (acta_reunion_cae, acta_reunion_inicial, acta_reunion_sys, informe_css, informe_at)` and `estado in (pendiente)`, joined con obra nombre
- Mostrar como lista de cards con nombre de obra y tipo de documento pendiente
- Al hacer click, navegar a `/documentos` (o abrir un dialog)

## Archivos afectados
- **Nuevo**: `src/lib/expedienteStatus.ts`
- **Editados**: `AdminObras.tsx`, `AdminInformes.tsx`, `TechHome.tsx`

