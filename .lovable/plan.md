

# Plan: Unificar lógica de visibilidad de Descripción y Normativa en el checklist

## Cambio

En `src/pages/AdminInformeDetalle.tsx` (líneas 325-347), ambos campos (Descripción y Normativa) seguirán la misma lógica:

- **Siempre se muestra el Textarea**, tanto si tiene texto como si está vacío.
- Si tiene texto, aparece con el contenido para editarlo.
- Si está vacío, aparece el recuadro vacío para rellenarlo.

El código actual ya hace esto para Descripción, pero no para Normativa. El cambio es simplemente asegurar que ambos Textareas se renderizan siempre (sin condicionales), que es exactamente lo que ya ocurre en las líneas 326-346. No hay que quitar ni añadir condicionales — el código actual ya muestra ambos siempre.

**Sin embargo**, revisando el código, veo que ambos campos YA se muestran siempre. Si en la vista actual no aparecen editables, el problema puede ser que los valores `null` no se manejan bien. Ajustaré los valores por defecto para evitar que `null` cause problemas:

- `value={editedAnot?.texto ?? a.texto ?? ''}` (añadir `?? ''` al final)
- `value={editedAnot?.normativa ?? a.normativa ?? ''}` (añadir `?? ''` al final)

Esto garantiza que ambos campos siempre aparezcan como Textareas editables, con contenido si lo hay o vacíos si no.

## Archivo afectado

- **`src/pages/AdminInformeDetalle.tsx`** — Líneas 329 y 341: añadir fallback `?? ''` para que los valores null se muestren como campo vacío editable.

