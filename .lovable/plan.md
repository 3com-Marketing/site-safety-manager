# Arreglar duplicación de frases al grabar voz en móvil

## El problema real

El fix anterior usa `event.resultIndex` para procesar solo resultados nuevos, pero en móvil (Chrome Android / Safari iOS) eso **no es suficiente** porque:

1. Cuando el navegador termina solo el reconocimiento (cada ~5-10 s) y disparamos `recognition.start()` de nuevo, **se crea una sesión completamente nueva**. En esa sesión nueva, `event.results` empieza otra vez desde 0 y `event.resultIndex` también — pero el motor móvil **vuelve a entregar como "final" frases que ya había entregado** en la sesión anterior (mantiene un buffer interno o las re-procesa).
2. Además, durante una misma sesión móvil, un mismo segmento puede llegar varias veces marcado como `isFinal` cuando el motor "consolida" resultados intermedios. Como concatenamos a `finalTranscriptRef.current += transcript` sin comprobar nada, se duplica.
3. Resultado: cada par de segundos se reañade el texto entero. El usuario ve "hola buenas hola buenas hola buenas hola buenas..." sin parar.

## La solución

Deduplicar por contenido antes de acumular en `finalTranscriptRef`, y reiniciar el índice de resultados ya consumidos en cada sesión nueva.

### Cambios en `src/hooks/useVoiceNote.ts`

1. **Mantener un buffer por sesión** (`sessionFinalsRef`: array de strings finales ya vistos en la sesión actual). En cada `onresult`, en vez de `finalTranscriptRef.current += transcript`, hacer:
   - Para cada índice `i` de un resultado `isFinal`, comparar `transcript` con `sessionFinalsRef.current[i]`.
   - Si es nuevo o diferente (el motor a veces refina), reemplazar y reconstruir `finalTranscriptRef` como la concatenación de todo lo que **no** está ya en él.
   - Mejor aún: tratar los finales de la sesión como un array indexado por `i`. El texto total = `previousSessionsText + sessionFinalsRef.current.join(' ')`.

2. **Separar texto de sesiones anteriores** del texto de la sesión actual:
   - `committedTextRef`: texto ya cerrado de sesiones anteriores (lo que había en `sessionFinalsRef` cuando se disparó `onend`).
   - `sessionFinalsRef`: array de finales de la sesión activa, indexado por posición del resultado.
   - En `onend` (cuando vamos a reiniciar): mover `sessionFinalsRef.current.join(' ')` a `committedTextRef.current` y vaciar `sessionFinalsRef`.
   - En `onresult`: `sessionFinalsRef.current[i] = transcript` para cada final (sobrescribe si el motor refina), y mostramos `committedTextRef + sessionFinalsRef.join(' ') + interim`.

3. **Deduplicación adicional anti-solape entre sesiones**: cuando movemos texto de sesión a `committedTextRef`, comprobar si el principio del nuevo texto ya estaba al final del anterior (algunos motores móviles repiten el último segmento al reanudar). Si hay solape de N caracteres, recortarlo.

4. **Resetear ambas refs en `startRecording` y `openDialog`**, y en `finishRecording` leer `committedTextRef + sessionFinalsRef.join(' ')`.

### Esquema

```text
sesión 1: sessionFinalsRef = ["hola", "buenas tardes"]
display = "" + "hola buenas tardes" + interim

onend → committedTextRef = "hola buenas tardes"
        sessionFinalsRef = []

sesión 2 arranca, motor manda de nuevo "buenas tardes" como final[0]
        sessionFinalsRef = ["buenas tardes"]
        antes de mostrar: detectar solape con final de committedText → recortar
display = "hola buenas tardes" (sin duplicar)

usuario sigue hablando → sessionFinalsRef = ["buenas tardes", "estoy en obra"]
display = "hola buenas tardes estoy en obra"
```

## Archivos a modificar

- `src/hooks/useVoiceNote.ts` — lógica de acumulación y deduplicación descrita arriba. La API pública del hook no cambia.

## Resultado esperado

- En móvil el texto crece de forma natural según hablas, sin repetir frases aunque el motor reinicie por debajo varias veces.
- En escritorio sigue igual (allí solo hay una sesión continua, y `sessionFinalsRef` indexado funciona idéntico al comportamiento actual).
