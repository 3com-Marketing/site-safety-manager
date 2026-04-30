## Problema

En la pantalla de progreso de la visita, la sección **"Datos generales"** siempre aparece como **"Sin completar"**, incluso después de pulsar "Guardar datos" y recibir el toast de confirmación. El resto de secciones (EPIs, incidencias, etc.) sí reflejan su estado correctamente.

## Causa

En `src/pages/VisitaActiva.tsx` (línea 417), el mapa de completados tiene este valor fijo:

```ts
datos_generales: false, // datos generales doesn't have a "completed" state for now
```

Nunca se actualiza, por lo que no importa lo que el usuario rellene: la sección siempre se muestra como pendiente.

Los datos de esta sección se guardan directamente en la tabla `informes` (campos `num_trabajadores`, `condiciones_climaticas`, `empresas_presentes`, `notas_generales`), no en `checklist_bloques`.

## Solución

Considerar **"Datos generales" como completado** cuando exista al menos un dato relevante guardado en el informe. Criterio:

- `num_trabajadores` no nulo, **o**
- `condiciones_climaticas` con texto no vacío, **o**
- `empresas_presentes` con texto no vacío, **o**
- `notas_generales` con texto no vacío.

(Basta con uno; así un técnico que solo informe meteorología o solo nº de trabajadores también la verá como completada.)

### Cambios concretos

1. **`src/pages/VisitaActiva.tsx`**
   - Asegurar que el `informe` cargado incluye los 4 campos (`num_trabajadores`, `condiciones_climaticas`, `empresas_presentes`, `notas_generales`). Si ya están en el select del informe, no hace falta tocarlo; si no, ampliarlo.
   - Reemplazar la línea hardcodeada por:
     ```ts
     datos_generales: Boolean(
       informe?.num_trabajadores != null ||
       informe?.condiciones_climaticas?.trim() ||
       informe?.empresas_presentes?.trim() ||
       informe?.notas_generales?.trim()
     ),
     ```
   - Tras guardar en `SeccionDatosGenerales`, ya volvemos a la lista de secciones y `fetchData()` se dispara desde el padre (verificar; si no, llamar `fetchData` al volver para refrescar el estado de completado).

2. **`src/components/visita/SeccionDatosGenerales.tsx`**
   - Añadir prop opcional `onSaved?: () => void` y llamarla tras un guardado correcto, para que el padre refresque el `informe` y el progreso (8 de 9 → 9 de 9).

## Resultado esperado

Tras pulsar "Guardar datos" en Datos generales y volver al listado, la sección aparecerá con el check verde "Completado" y el progreso de la visita avanzará correctamente.
