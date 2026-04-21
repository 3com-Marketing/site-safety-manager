

# Plan: Corregir duplicación de texto en dictado por voz y mantener botón visible

## Problemas

1. **Texto duplicado**: El `SpeechRecognition` con `continuous: true` e `interimResults: true` acumula `finalTranscript` en una variable local del closure. Cada vez que el motor reenvía resultados finales previos, se vuelven a concatenar, causando frases repetidas.

2. **Botón "Mejorar con IA" fuera de pantalla**: La transcripción crece sin límite y empuja el botón fuera del viewport del diálogo.

## Solución

### 1. Corregir duplicación en `src/hooks/useVoiceNote.ts`

Cambiar la lógica de `onresult` para reconstruir todo el transcript desde `event.results` en cada evento, en vez de acumular en una variable local:

```typescript
recognition.onresult = (event: any) => {
  let final = '';
  let interim = '';
  for (let i = 0; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      final += transcript + ' ';
    } else {
      interim = transcript;
    }
  }
  setRawTranscript(final + interim);
};
```

Esto elimina la variable `finalTranscript` del closure y recorre **todos** los resultados desde el índice 0 en cada evento, evitando duplicación.

### 2. Limitar altura de transcripción y fijar botón en `src/components/visita/VoiceNoteDialog.tsx`

- Envolver el contenido del paso `recording` en un layout flex con `max-h-[70vh]` y `overflow-hidden`.
- La zona de transcripción tendrá `max-h-[30vh] overflow-y-auto` para que sea scrollable.
- El botón "Mejorar con IA" quedará fijo en la parte inferior del diálogo, siempre visible.

```tsx
{dialogStep === 'recording' && (
  <div className="flex flex-col max-h-[70vh]">
    {/* Micrófono - fijo arriba */}
    <div className="flex flex-col items-center gap-4 py-4 shrink-0">
      ...botón mic...
    </div>

    {/* Transcripción - scrollable */}
    {rawTranscript && (
      <div className="rounded-lg bg-muted p-3 max-h-[30vh] overflow-y-auto shrink">
        <p className="text-xs text-muted-foreground mb-1">Transcripción:</p>
        <p className="text-sm">{rawTranscript}</p>
      </div>
    )}

    {/* Botón - fijo abajo */}
    <Button className="h-12 w-full mt-4 shrink-0" ...>
      Mejorar con IA
    </Button>
  </div>
)}
```

## Archivos afectados
- **`src/hooks/useVoiceNote.ts`** — corregir lógica de acumulación de transcript
- **`src/components/visita/VoiceNoteDialog.tsx`** — layout scrollable con botón siempre visible

