# Arreglar grabación de voz en móvil

## El problema

En móvil (sobre todo Chrome Android y Safari iOS), la `Web Speech API` se comporta de forma muy distinta que en escritorio:

1. **Se corta sola a los pocos segundos**: Chrome Android dispara `onend` automáticamente tras ~5–10 s de silencio, aunque hayas puesto `continuous = true`. En escritorio `continuous` funciona; en móvil se ignora en la práctica.
2. **Repite frases en textos largos**: el bug clásico de `webkitSpeechRecognition` en Android. Cuando el motor reinicia internamente o concatena resultados, el array `event.results` incluye desde índice 0 todos los resultados anteriores. Como el código actual recorre `for (let i = 0; i < event.results.length; i++)` y **sobreescribe** `rawTranscript` con todo concatenado, cada vez que llega un nuevo trozo se vuelven a añadir los anteriores → frases duplicadas y multiplicadas.

Código actual problemático en `src/hooks/useVoiceNote.ts`:
```ts
recognition.onresult = (event: any) => {
  let final = '';
  let interim = '';
  for (let i = 0; i < event.results.length; i++) { // recorre TODO el histórico
    ...
  }
  setRawTranscript(final + interim); // sobreescribe con todo
};
recognition.onend = () => { setIsRecording(false); }; // en móvil se dispara solo
```

## La solución

Reescribir el hook para que se comporte de forma robusta en móvil:

### 1. Usar `event.resultIndex` en vez de empezar desde 0
Procesar solo los resultados nuevos desde `event.resultIndex` y **acumular** los `final` en una ref persistente, en vez de recalcular todo el string cada vez. Así eliminamos las repeticiones.

### 2. Auto-reinicio en móvil cuando `onend` se dispara solo
Mientras el usuario no haya pulsado "parar" (flag `shouldKeepRecordingRef`), si llega `onend` se vuelve a llamar a `recognition.start()` automáticamente. El usuario percibe una grabación continua aunque por debajo el motor reinicie.

### 3. Manejo de errores típicos de móvil
- `no-speech`, `audio-capture`, `network`: reintentar en vez de cortar.
- `not-allowed`: avisar de permisos de micrófono.
- `aborted`: parada intencional, no reintentar.

### 4. Mantener interim text aparte
El texto provisional (interim) se muestra pero no se acumula al `final` hasta que llega como `isFinal`, evitando que se duplique al reiniciar.

### Esquema del nuevo flujo

```text
start() → shouldKeepRecording = true → recognition.start()
        ↓
   onresult (resultIndex=N)
        ↓
   acumular nuevos finales en finalRef
   mostrar finalRef + interim
        ↓
   onend (móvil corta solo)
        ↓
   ¿shouldKeepRecording? → sí → recognition.start() de nuevo
                        → no → setIsRecording(false)

stop() → shouldKeepRecording = false → recognition.stop()
```

## Archivos a modificar

- **`src/hooks/useVoiceNote.ts`** — reescribir `startRecording`, `stopRecording` y los handlers `onresult` / `onend` / `onerror` con la lógica anterior. Añadir refs para `finalTranscriptRef` y `shouldKeepRecordingRef`.

No hace falta tocar `VoiceNoteDialog.tsx` ni los componentes consumidores: la API pública del hook (`startRecording`, `stopRecording`, `rawTranscript`, etc.) se mantiene igual.

## Resultado esperado

- En móvil la grabación dura todo lo que el usuario quiera, sin cortes.
- No se repiten frases en textos largos.
- En escritorio sigue funcionando exactamente igual que ahora.
