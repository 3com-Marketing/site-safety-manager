# Plan: Arreglar geolocalización al iniciar visita

## Problema detectado

En `src/pages/SelectObra.tsx` el diálogo "Obteniendo ubicación" se abre con `<Dialog open={geo.status === 'requesting'}>` **sin `onOpenChange`**. Eso provoca varios problemas:

1. **No se puede cancelar el diálogo**: cuando el usuario pulsa la X o Esc, Radix intenta cerrarlo pero no hay handler que actualice `geo`, así que el estado queda en `requesting` mientras el navegador sigue esperando la respuesta de GPS. En el session replay se ve al usuario pulsando la X tres veces sin éxito.
2. **Si el usuario deniega o tarda en aceptar el permiso del navegador**, el diálogo se queda colgado hasta que salta el `timeout: 10000` ms, y como Radix bloquea la interacción por debajo, parece que la app no responde.
3. **No hay feedback de error**: si `getCurrentPosition` falla (permiso denegado, sin señal), se llama directamente a `createVisita(obraId, null, null)` y la visita se crea sin coordenadas, sin avisar al usuario de que su ubicación no se ha registrado.
4. **`maximumAge` no está definido**: cada intento pide GPS desde cero aunque haya una lectura reciente, lo que ralentiza el proceso.
5. **El watcher de permisos**: en algunos navegadores móviles, si se rechazó el permiso una vez, `getCurrentPosition` ni siquiera dispara el callback de error rápido — se queda en limbo hasta el timeout.

## Cambios

### `src/pages/SelectObra.tsx`

1. **Diálogo cancelable**: añadir `onOpenChange` al diálogo `requesting` para que al cerrarlo vuelva a `idle` y permitir reintentar.
2. **Botón "Cancelar"** dentro del diálogo de obtención de ubicación, además de la X.
3. **Botón "Continuar sin ubicación"** en el mismo diálogo: tras unos segundos esperando, el técnico puede decidir crear la visita sin coordenadas (útil si está dentro de un edificio sin señal GPS).
4. **Manejo de errores con toast**: si `getCurrentPosition` falla, mostrar un `toast.error` explicando el motivo (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`) y dejar al usuario decidir si reintenta o continúa sin ubicación, en vez de crear la visita silenciosamente sin coords.
5. **Opciones de geolocalización mejoradas**: añadir `maximumAge: 30000` para aceptar una posición cacheada de hasta 30 s, y subir el `timeout` a 15000 ms para móviles con GPS lento.
6. **Cancelación al desmontar**: usar un flag `cancelled` para ignorar la respuesta del GPS si el usuario cerró el diálogo antes de que llegara.
7. **Pre-check del permiso**: si `navigator.permissions` está disponible, consultar el estado antes de pedir GPS. Si está `denied`, mostrar directamente el diálogo de error con instrucciones para habilitarlo en el navegador, sin esperar al timeout.

### Sin cambios en

- `MapPicker.tsx`, `geo.ts` y la lógica de creación de la visita en sí (la `INSERT` en `visitas`/`informes` se mantiene igual).

## Resultado esperado

- El delegado puede cerrar/cancelar el diálogo de ubicación en cualquier momento.
- Si deniega el permiso, ve un mensaje claro inmediatamente (no espera 10 s).
- Puede elegir continuar sin ubicación de forma explícita en lugar de que ocurra "por accidente".
- El GPS responde más rápido al permitir cache de 30 s.

## Archivos afectados

- **`src/pages/SelectObra.tsx`**
