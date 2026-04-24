## Diagnóstico

No, no parece un problema “imposible de solucionar”. Sí parece un bug real del reconocimiento de voz en móvil, pero además ahora mismo hay un fallo concreto en cómo la app interpreta esos eventos.

### Do I know what the issue is?
Sí.

### Qué está pasando exactamente
En escritorio, el motor suele devolver fragmentos bastante estables.
En móvil, el motor Web Speech suele comportarse distinto:

- reenvía hipótesis acumuladas en lugar de fragmentos nuevos
- a veces marca resultados como `final` demasiado pronto
- a veces vuelve a emitir el mismo contenido en varios índices
- en sesiones largas con `continuous = true`, puede entregar una especie de “escalera” de prefijos:  
  `la` → `la señalización` → `la señalización está mal` → etc.

Las capturas que has pasado encajan exactamente con ese patrón.

### El problema concreto en el código actual
El fallo principal está en `src/hooks/useVoiceNote.ts`:

- el código sigue recorriendo `event.results` completos en cada `onresult`
- guarda cada índice final como si fuese un fragmento independiente
- luego hace `joinPieces(sessionFinalsRef.current)`

Eso funciona si cada índice contiene una frase nueva.
Pero en móvil muchas veces **cada índice no es una frase nueva, sino una versión ampliada de la anterior**.

Resultado:

```text
índice 0 = "la"
índice 1 = "la señalización"
índice 2 = "la señalización está mal"
```

Si eso se concatena, sale justo el efecto que estás viendo:

```text
la la señalización la señalización está mal ...
```

Por eso la deduplicación anterior no lo está arreglando: estaba pensada sobre todo para solapes entre reinicios de sesión, pero **el problema fuerte ahora ocurre dentro de la misma sesión viva**.

También hay dos agravantes:

- no se está aprovechando `event.resultIndex` como frontera real de lo que cambió
- la estrategia actual deduplica contra `committedText`, pero no normaliza bien los prefijos acumulativos dentro de la sesión actual

## Qué se va a corregir

### 1. Rehacer la lógica de ensamblado del dictado en `useVoiceNote`
En vez de tratar cada resultado final como una pieza que se suma, el hook pasará a mantener una representación canónica de la sesión actual.

La idea será:

- procesar solo desde `event.resultIndex`
- detectar si un resultado nuevo reemplaza/amplía a uno anterior
- si el texto nuevo contiene al anterior como prefijo, **reemplazar**, no añadir
- ignorar duplicados exactos consecutivos
- seguir deduplicando contra lo ya comprometido entre reinicios

## 2. Añadir deduplicación dentro de la misma sesión, no solo entre sesiones
Se incorporará una capa específica para móvil que detecte estos casos:

- mismo texto repetido tal cual
- prefijo ampliado (`"la señalización"` → `"la señalización está mal"`)
- frase reenviada con pequeña variación de puntuación o espacios
- resultado “final” duplicado por el navegador

Esto se hará con comparación normalizada por palabras y prefijos, no por longitud de caracteres.

## 3. Cambiar la estrategia en móvil para no depender del modo problemático
Para móvil, el plan es usar un modo más robusto frente al bug del navegador:

- evitar que una sesión larga acumule una lista enorme de resultados reutilizados
- apoyarse en ciclos cortos de reconocimiento con reinicio automático
- mantener la grabación continua para el usuario, pero tratar cada ciclo como una unidad controlada

En la práctica, revisaré el uso de `continuous = true` en móvil y lo sustituiré por una estrategia más estable si confirma el patrón que ya hemos diagnosticado.

## 4. Mantener escritorio intacto
El comportamiento de escritorio no se tocará salvo para beneficiarse de la nueva lógica común si no rompe nada.

La corrección estará pensada para:

- conservar la experiencia actual en ordenador
- aplicar tratamiento especial solo cuando el navegador móvil lo necesite

## Archivos a tocar

- `src/hooks/useVoiceNote.ts`
- `src/components/visita/VoiceNoteDialog.tsx` solo si hace falta añadir trazas visuales o ajustar el flujo del botón, pero el cambio principal está en el hook

## Detalles técnicos

### Refactor propuesto para `useVoiceNote.ts`

- usar `event.resultIndex` para no reinterpretar toda la lista cada vez
- sustituir `sessionFinalsRef.current[i] = transcript` + `joinPieces(...)` por una estructura que represente:
  - texto comprometido
  - último bloque final válido de la sesión
  - interim actual
- si un nuevo resultado es una ampliación del anterior, reemplazar el anterior
- si un nuevo resultado es un duplicado exacto, descartarlo
- si un nuevo resultado empieza con texto ya comprometido, recortar ese prefijo
- en móvil, tratar con cautela resultados `final` sospechosos o duplicados antes de incorporarlos

### Estrategia de seguridad

```text
committed text
+ current accepted segment (canónico)
+ current interim
= texto visible
```

No se volverán a concatenar todos los índices finales como si cada uno fuese independiente.

## Validación

Voy a considerar arreglado el problema solo si se cumple esto:

- en móvil, el texto visible ya no crece en forma de escalera repetitiva
- al hablar una frase larga, no aparecen bloques del tipo “la la señalización la señalización...”
- al pulsar “Parar y revisar”, el texto final coincide con lo hablado sin inflarse
- en escritorio, el dictado sigue funcionando como ahora

## Resultado esperado

Después de este cambio, el dictado en móvil debería dejar de repetir frases “hasta la saciedad”.
No lo diagnostico como una limitación irresoluble, sino como una combinación de:

- bug conocido del motor de voz móvil
- y una estrategia de ensamblado en el hook que en móvil interpreta mal esos resultados acumulativos

La corrección va dirigida exactamente a ese punto.