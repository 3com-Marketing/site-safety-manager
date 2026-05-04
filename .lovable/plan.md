## Objetivo

En el Acta Reunión CAE, el formulario guarda los campos `punto2_no_procede` (checkbox) y `punto2_otros` (texto libre) al final del Punto 2, pero el PDF no los pinta. Hay que renderizarlos en el PDF al final del Punto 2, con el mismo estilo que aparece en el documento de referencia: dos casillas en línea — `No procede ☐` y `Otros ☐` — donde la casilla aparece marcada (☑) si está activa, y "Otros" muestra el texto especificado a continuación.

## Cambio a realizar

**Archivo:** `supabase/functions/generar-documento-pdf/index.ts`

Dentro de `templateActaReunionSimple`, justo después del bloque `texto_punto2_bloque2` (línea 508) y antes del bloque "Plataforma CAE" (línea 510), añadir un nuevo bloque que renderice "No procede" y "Otros" en una sola línea centrada, replicando el formato del documento original.

### Lógica

```typescript
// No procede / Otros (cierre del punto 2)
const noProcede = extra.punto2_no_procede ? "☑" : "☐";
const otrosText = (extra.punto2_otros || "").trim();
const otrosCheck = otrosText ? "☑" : "☐";
const otrosLabel = otrosText ? `Otros ${otrosCheck} ${otrosText}` : `Otros ${otrosCheck}`;

if (extra.punto2_no_procede || otrosText) {
  html += `<p style="font-size:9pt;text-align:center;margin-top:10pt;">
    <span style="margin-right:40pt;">No procede ${noProcede}</span>
    <span>${otrosLabel}</span>
  </p>`;
}
```

Esto reproduce la línea `No procede ☐    Otros ☐` del PDF original, mostrando el contenido de "Otros" cuando se haya rellenado.

## Notas

- No hay cambios en formulario, base de datos ni configuración. Los datos ya se guardan correctamente en `extra.punto2_no_procede` y `extra.punto2_otros`.
- Solo se pinta la línea si al menos uno de los dos está marcado / con texto, para no añadir ruido visual cuando no proceda.
