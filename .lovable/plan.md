

# Plan: Hacer los informes de visita editables

## Problema

1. **"Ver informe completo (editable)" no permite editar** — La página `AdminInformeDetalle` muestra los datos generales (nº trabajadores, condiciones climáticas, empresas presentes, notas) como texto estático. Solo las incidencias tienen campos editables. Las amonestaciones y observaciones tampoco se pueden editar.

2. **El botón "Editar" de DocumentosList no aparece en la web publicada** — El código ya está implementado correctamente, pero necesitas publicar de nuevo la aplicación y limpiar la caché del navegador.

## Solución

### 1. Hacer editables todos los campos en `AdminInformeDetalle`

Convertir los campos de solo lectura en campos editables:

- **Datos generales**: Cambiar los `<p>` estáticos por `<Input>` y `<Textarea>` para: nº trabajadores, condiciones climáticas, empresas presentes, notas generales.
- **Amonestaciones**: Añadir `<Input>` para trabajador, `<Textarea>` para descripción.
- **Observaciones**: Añadir `<Textarea>` para texto.
- **Guardar**: Ampliar `saveChanges` para guardar también los cambios en la tabla `informes` (datos generales), `amonestaciones` y `observaciones`, además de las incidencias que ya funcionan.

### 2. Estado de edición

Añadir estados para trackear cambios en:
- `editedInforme`: objeto con los campos generales modificados (`num_trabajadores`, `condiciones_climaticas`, `empresas_presentes`, `notas_generales`)
- `editedAmonestaciones`: mapa `id → { trabajador, descripcion }`
- `editedObservaciones`: mapa `id → { texto }`

El botón "Guardar cambios" aparecerá cuando haya cualquier cambio pendiente en cualquier sección.

## Archivos afectados

- **`src/pages/AdminInformeDetalle.tsx`** — Convertir datos generales, amonestaciones y observaciones de solo lectura a editables, ampliar lógica de guardado

