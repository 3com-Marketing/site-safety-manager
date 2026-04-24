## Objetivo
Corregir definitivamente la repetición de frases al dictar en móvil, manteniendo el comportamiento correcto que ya existe en escritorio.

## Qué se va a hacer

1. Ajustar la lógica de transcripción en `src/hooks/useVoiceNote.ts` para deduplicar el texto antes de pintarlo en pantalla, no solo al cerrar una sesión interna del reconocimiento.
2. Reemplazar el recorte actual de solapes por una comparación más robusta, basada en palabras normalizadas, para detectar cuando el navegador móvil reenvía una frase ya dictada completa o parcialmente.
3. Hacer que cada reinicio automático del reconocimiento conserve solo el texto realmente nuevo, tanto en la vista en vivo como al pulsar “Parar y revisar”.
4. Mantener la API pública del hook para no tocar la integración en las secciones que ya usan voz (`ChecklistBloque`, `SeccionObservaciones`, `SeccionIncidencias`, `SeccionDatosGenerales`, `SeccionAmonestaciones`).
5. Aprovechar para limpiar el modal de voz (`VoiceNoteDialog`) y quitar los warnings actuales del diálogo que pueden provocar remounts o ruido al depurar.

## Resultado esperado

- En móvil, el texto crecerá de forma natural mientras hablas.
- Si el navegador corta y reinicia internamente el reconocimiento, no volverá a añadir lo ya dictado.
- Al revisar el texto final, no aparecerán bloques repetidos.
- En escritorio no cambiará la experiencia actual.

## Detalles técnicos

### `src/hooks/useVoiceNote.ts`
- Añadir una función de deduplicación “en vivo” para construir `rawTranscript` con:
  - texto ya confirmado
  - texto útil de la sesión actual
  - interim actual
- Detectar tres casos móviles típicos:
  - reenvío exacto del texto anterior
  - reenvío parcial del final de la sesión previa
  - una nueva sesión que empieza con texto viejo y continúa con texto nuevo
- Usar comparación normalizada por palabras en vez del recorte actual por longitud de caracteres.
- Aplicar la misma deduplicación tanto en `onresult` como en `onend` y `finishRecording`.

### `src/components/visita/VoiceNoteDialog.tsx`
- Añadir `DialogDescription` o `aria-describedby` correcto.
- Ajustar la estructura del diálogo para eliminar los warnings de Radix/React vistos en consola.

## Archivos previstos
- `src/hooks/useVoiceNote.ts`
- `src/components/visita/VoiceNoteDialog.tsx`

## Validación
- Probar que en móvil la transcripción visible ya no se infla con repeticiones.
- Verificar que “Parar y revisar” conserva solo el texto deduplicado.
- Confirmar que el modal abre y cierra sin warnings del diálogo.