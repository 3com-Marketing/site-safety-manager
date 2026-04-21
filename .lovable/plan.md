

# Plan: Formularios directos para Incidencias, Amonestaciones y Observaciones en AdminInformeDetalle

## Problema

Las secciones de Incidencias, Amonestaciones y Observaciones en la vista de detalle del informe (`/admin/informe/:id`) solo muestran "Sin observaciones" / "Sin amonestaciones" cuando estan vacias. No hay forma de crear contenido nuevo desde esta pantalla de admin.

## Solucion

Anadir un formulario inline en cada seccion que permita crear registros nuevos directamente, sin necesidad de navegar a la vista del tecnico.

### Cambios en `src/pages/AdminInformeDetalle.tsx`

1. **Anadir estado para formularios nuevos**: tres bloques de estado local para los campos de cada formulario nuevo (incidencia, amonestacion, observacion).

2. **Anadir funciones de creacion**: tres funciones `addIncidencia`, `addAmonestacion`, `addObservacion` que insertan el registro en la base de datos y recargan los datos.

3. **Seccion Incidencias** (lineas 385-425): despues de la lista de incidencias existentes, anadir un bloque con:
   - Input para titulo
   - Textarea para descripcion
   - Boton "Anadir incidencia"

4. **Seccion Amonestaciones** (lineas 434-469): reemplazar el "Sin amonestaciones" por el formulario (y tambien mostrarlo despues de items existentes):
   - Input para nombre del trabajador
   - Textarea para descripcion
   - Boton "Anadir amonestacion"

5. **Seccion Observaciones** (lineas 478-501): misma logica:
   - Textarea para texto
   - Boton "Anadir observacion"

Cada formulario se muestra siempre (tanto si hay registros como si no), al final de la lista de elementos existentes. Tras crear el registro, se limpia el formulario y se recarga la lista.

## Archivo afectado

- **`src/pages/AdminInformeDetalle.tsx`** -- Anadir estado, handlers y formularios inline para las tres secciones.

