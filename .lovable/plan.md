# Plan: Mejorar con IA al editar notas existentes

## Problema

Hoy, al editar una anotación/incidencia/amonestación/observación ya guardada (técnico) o un texto en el detalle del informe (admin), solo aparece un `Textarea` con "Guardar / Cancelar". No hay forma de pedirle a la IA que mejore ese texto. La opción "Mejorar con IA" solo existe dentro del diálogo de voz justo después de dictar.

## Solución

Crear un componente reutilizable **`EditableTextWithAI`** que muestre:
- Un `Textarea` editable (igual que ahora)
- Tres botones: **Guardar**, **Mejorar con IA**, **Cancelar**

Al pulsar "Mejorar con IA":
1. Llama a la edge function `mejorar-texto` (la que ya existe) con el texto actual y la categoría correspondiente
2. Reemplaza el contenido del textarea con la versión mejorada
3. Si la función devuelve normativa, la muestra debajo en un bloque informativo
4. El usuario sigue pudiendo editar, volver a mejorar, guardar o cancelar

Si no hay conexión o la IA falla, se muestra un toast y el texto original queda intacto.

## Componente nuevo

**`src/components/visita/EditableTextWithAI.tsx`**

```tsx
interface Props {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  categoria: string;  // p.ej. 'Incidencia de seguridad', 'Observación general'
  saving?: boolean;
}
```

Internamente:
- Estado local `isImproving` y `normativa`
- Función `improve()` que invoca `supabase.functions.invoke('mejorar-texto', { body: { texto: value, categoria } })`
- Maneja errores 429/402 con toasts claros

## Archivos a modificar

### Lado técnico (todos pasan a usar `EditableTextWithAI`)

- **`src/components/visita/ChecklistBloque.tsx`** — bloque de edición de anotaciones (líneas 221-228), categoria = `bloque.titulo`
- **`src/components/visita/SeccionIncidencias.tsx`** — bloque edición (230-237), categoria = `'Incidencia de seguridad'`
- **`src/components/visita/SeccionAmonestaciones.tsx`** — bloque edición (276-283), categoria = `'Amonestación a trabajador'`
- **`src/components/visita/SeccionObservaciones.tsx`** — bloque edición (218-225), categoria = `'Observación general'`

### Lado admin

- **`src/pages/AdminInformeDetalle.tsx`** — añadir un botón pequeño "Mejorar con IA" junto a cada `Textarea` editable de incidencias/amonestaciones/observaciones (líneas 419, 438, 547, 604). Reusa el mismo componente o un wrapper más compacto.

## Detalles técnicos

- La edge function `mejorar-texto` ya acepta `{ texto, categoria }` y devuelve `{ texto_mejorado, normativa }` — no requiere cambios.
- No se toca `useVoiceNote` ni `VoiceNoteDialog`: el flujo de voz sigue igual.
- El componente es offline-friendly: si falla la red, el textarea conserva el texto original y el usuario puede guardar manualmente.
- Categorías mejor afinadas que las genéricas para que la IA dé normativa más relevante.

## Resultado

En cualquier punto donde se edite un texto guardado (técnico en obra o admin en oficina), un solo clic basta para que la IA lo profesionalice y aporte normativa, sin perder lo que el usuario ya había escrito a mano.
