Ajustar el orden y los colores del checklist del punto 11 del Acta Reunión CAE en el PDF para que siga la misma lógica visual que los puntos 10 y 13:

- Mostrar primero `NO` (en gris) y después `SÍ` (en verde), en lugar del orden actual.
- Mantener exactamente el mismo estilo de los puntos 10 y 13: `NO PROCEDE` en color apagado y `SÍ PROCEDE` en verde, adaptado aquí a `NO` / `SÍ`.
- No tocar la lógica de selección ni el contenido del bloque de justificación, solo el orden y los colores de las dos opciones del checklist.

Detalles técnicos
- Archivo a modificar: `supabase/functions/generar-documento-pdf/index.ts`, sección del punto 11.
- Tras el cambio, redeplegar la función `generar-documento-pdf`.