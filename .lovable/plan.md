## Objetivo
Corregir el PDF del Acta Reunión CAE para que en los puntos 10 y 13 se vean siempre las dos opciones del checklist (`NO PROCEDE` y `SÍ PROCEDE`), marcando la elegida, en lugar de mostrar solo una.

## Qué voy a cambiar
1. Revisar y ajustar el render del generador de PDF en `supabase/functions/generar-documento-pdf/index.ts` para los puntos 10 y 13.
2. Forzar un bloque visual de checklist estable en ambos puntos, con este comportamiento:
   - si está seleccionado `si_procede`: mostrar `☐ NO PROCEDE` y `☑ SÍ PROCEDE`
   - si está seleccionado `no_procede`: mostrar `☑ NO PROCEDE` y `☐ SÍ PROCEDE`
3. Mantener el cuadro verde de texto solo cuando el valor sea `si_procede`.
4. Verificar que la previsualización `/admin/documento/:id/preview` y la impresión usen exactamente ese HTML actualizado.

## Hallazgo clave
He comprobado que el código fuente del generador ya contiene una versión de esta lógica, pero la previsualización real sigue mostrando solo una opción:

```text
Punto 10: aparece solo “✔ SÍ PROCEDE”
Punto 13: aparece solo “✘ NO PROCEDE”
```

Eso indica que el cambio visible no está llegando correctamente al HTML final que devuelve la función en ejecución, así que la corrección debe centrarse en alinear el código desplegado con el render esperado y dejar el marcado explícito para ambos casos.

## Detalles técnicos
- Archivo principal: `supabase/functions/generar-documento-pdf/index.ts`
- Revisaré específicamente los bloques de:
  - `extra.punto10_procede`
  - `extra.punto13_procede`
- El render final quedará con un marcado explícito de ambas casillas en el HTML devuelto por la función.
- No hace falta tocar base de datos.
- No debería hacer falta cambiar el formulario salvo que detecte que el valor guardado no coincide con lo que consume el PDF.

## Validación
Después de aplicar el cambio, comprobaré en la previsualización del documento actual que:
1. En el punto 10 se vean las dos opciones.
2. En el punto 13 se vean las dos opciones.
3. El check correcto quede marcado según la selección.
4. El cuadro verde siga saliendo solo cuando corresponde.

## Resultado esperado
El PDF final del Acta Reunión CAE mostrará en los puntos 10 y 13 un checklist completo y consistente, igual que en un formulario en papel, sin ocultar ninguna de las dos opciones.