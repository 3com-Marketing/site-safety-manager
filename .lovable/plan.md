

# Plan: Hacer editables las anotaciones del checklist

## Problema

Todo el contenido real del informe (textos descriptivos, normativa, fotos) esta en las anotaciones del checklist. Esta seccion muestra los datos como texto estatico sin posibilidad de edicion. Las secciones de incidencias, amonestaciones y observaciones ya tienen campos editables implementados, pero estan vacias en este informe.

## Solucion

Convertir cada anotacion del checklist en campos editables (Textarea para texto y normativa) y ampliar la logica de guardado.

### Cambios en `src/pages/AdminInformeDetalle.tsx`

1. **Nuevo estado** `editedAnotaciones` para trackear cambios:
```typescript
const [editedAnotaciones, setEditedAnotaciones] = useState<
  Record<string, { texto?: string; normativa?: string }>
>({});
```

2. **Handler** para cambios en anotaciones.

3. **Incluir `editedAnotaciones` en `hasEdits`** para que el boton "Guardar cambios" aparezca.

4. **Incluir en `saveChanges`** el guardado contra la tabla `anotaciones` (que ya tiene RLS con UPDATE para owners y admins).

5. **Reemplazar el bloque de renderizado** (lineas 308-319): cambiar los `<p>` estaticos por `<Textarea>` editables para texto y normativa, manteniendo las fotos como imagen.

Resultado: cada anotacion del checklist mostrara campos editables para su texto y normativa. Las fotos seguiran siendo solo visualizacion.

## Archivos afectados

- **`src/pages/AdminInformeDetalle.tsx`** -- Anadir estado, handler, campos editables y logica de guardado para anotaciones del checklist

