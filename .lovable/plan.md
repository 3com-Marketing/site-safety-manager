

# Plan: Separar grabacion de voz de la mejora con IA

## Problema actual

Al grabar una nota de voz, el unico boton disponible es "Mejorar con IA", que obliga a tener conexion a internet para guardar. Si no hay cobertura, no se puede guardar nada.

## Nuevo flujo

1. **Grabar** -- Pulsar micro, hablar, pulsar para parar
2. **Revisar y guardar** -- Ver la transcripcion en un textarea editable. Boton principal: "Guardar nota" (guarda el texto tal cual, sin IA). Boton secundario: "Mejorar con IA" (solo si hay conexion, mejora el texto y vuelve al paso de edicion con el texto mejorado)
3. **Repetir** -- Boton para volver a grabar desde cero

## Cambios

### 1. `src/hooks/useVoiceNote.ts`

- Cambiar el tipo `VoiceDialogStep` de `'recording' | 'improving' | 'editing'` a `'recording' | 'improving' | 'reviewing'`.
- `finishRecording`: ya no llama a `improveText`. Solo para la grabacion, valida que hay texto, y cambia el step a `'reviewing'`.
- Exponer `improveText` en el return para que el dialog pueda llamarlo desde un boton.
- En `'reviewing'`, el texto editable es `rawTranscript` (no `improvedText`). Cuando el usuario pulsa "Mejorar con IA", se llama a `improveText` que cambia a `'improving'` y luego vuelve a `'reviewing'` con el texto mejorado en `improvedText`.

### 2. `src/components/visita/VoiceNoteDialog.tsx`

- Anadir prop `onImproveWithAI` y `isImproving`.
- **Step `'recording'`**: El boton principal cambia de "Mejorar con IA" a "Parar y revisar" (icono `Square` o `StopCircle`). Solo para la grabacion y pasa al paso de revision.
- **Step `'reviewing'`** (antes `'editing'`): 
  - Textarea editable con el texto (raw o mejorado).
  - Boton principal: "Guardar nota" (guarda lo que haya en el textarea).
  - Boton secundario: "Mejorar con IA" con icono `Sparkles` (llama a la IA, muestra spinner en el boton mientras procesa, actualiza el textarea con el resultado).
  - Boton "Repetir" para volver a grabar.
  - Si hay normativa (tras mejora IA), se muestra debajo del textarea.

### 3. Consumidores (4 archivos)

En `ChecklistBloque.tsx`, `SeccionIncidencias.tsx`, `SeccionAmonestaciones.tsx`, `SeccionObservaciones.tsx`:

- Actualizar `onSave` para que use `voice.improvedText || voice.rawTranscript` (el texto que haya en el textarea en ese momento, que ya se gestiona via `improvedText`/`setImprovedText`).
- Pasar la nueva prop `onImproveWithAI` al `VoiceNoteDialog`.

## Archivos afectados

- **`src/hooks/useVoiceNote.ts`** -- Separar finishRecording de improveText, exponer improveText
- **`src/components/visita/VoiceNoteDialog.tsx`** -- Nuevo flujo de 2 pasos (revisar primero, IA opcional)
- **`src/components/visita/ChecklistBloque.tsx`** -- Pasar nueva prop
- **`src/components/visita/SeccionIncidencias.tsx`** -- Pasar nueva prop
- **`src/components/visita/SeccionAmonestaciones.tsx`** -- Pasar nueva prop
- **`src/components/visita/SeccionObservaciones.tsx`** -- Pasar nueva prop

