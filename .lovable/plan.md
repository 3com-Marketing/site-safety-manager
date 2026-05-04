## Problema

En el **punto 10 (Interferencias entre empresas)** y **punto 13 (Ruegos y sugerencias)** del Acta Reunión CAE, el PDF solo muestra **una** de las dos opciones según lo elegido en el formulario:

- Si el usuario marca "Sí procede" → aparece solo `✔ SÍ PROCEDE` + el cuadro verde con el texto.
- Si marca "No procede" → aparece solo `✘ NO PROCEDE`.

El usuario quiere que **siempre se muestren las dos opciones tipo checklist** en el PDF (igual que un formulario en papel), marcando la elegida y dejando la otra sin marcar. El cuadro verde con el texto de "Sí procede" debe seguir apareciendo solo cuando esté seleccionado.

## Solución

Modificar el render del PDF en `supabase/functions/generar-documento-pdf/index.ts` para los puntos 10 y 13: en lugar de un `if/else` que muestra solo una etiqueta, renderizar **ambas líneas** con el carácter de checkbox (`☑` marcado / `☐` sin marcar) según corresponda.

### Resultado visual en el PDF (punto 10 y 13)

```text
[texto introductorio del punto]

☐ NO PROCEDE     ☑ SÍ PROCEDE

┌──────────────────────────────────────────┐
│ (cuadro verde con texto, solo si        │
│  procede está seleccionado)             │
└──────────────────────────────────────────┘
```

Si el usuario eligió "No procede":

```text
☑ NO PROCEDE     ☐ SÍ PROCEDE
```

(sin cuadro verde)

### Cambios técnicos

**Archivo único:** `supabase/functions/generar-documento-pdf/index.ts`

**Punto 10 (líneas ~639-646):** sustituir el bloque `if/else` actual por:

```ts
const siMark10 = extra.punto10_procede === 'si_procede' ? '☑' : '☐';
const noMark10 = extra.punto10_procede === 'si_procede' ? '☐' : '☑';
html += `<p style="font-size:9pt;font-weight:bold;margin-top:8pt;">
  <span style="margin-right:40pt;color:#666;">${noMark10} NO PROCEDE</span>
  <span style="color:#16a34a;">${siMark10} SÍ PROCEDE</span>
</p>`;
if (extra.punto10_procede === 'si_procede' && extra.punto10_texto_procede) {
  html += `<div style="border:2px solid #16a34a;border-radius:6pt;padding:8pt;margin-top:6pt;background:#f0fdf4;">
    <div class="section-text" style="font-size:9pt;">${renderRichText(extra.punto10_texto_procede)}</div>
  </div>`;
}
```

**Punto 13 (líneas ~688-695):** mismo patrón con las variables `punto13_procede` y `punto13_texto_procede`.

### Lo que NO cambia

- El formulario (`FormActaReunion.tsx`) sigue igual: el usuario elige una opción con los botones existentes.
- La lógica de mostrar/ocultar el cuadro verde con texto sigue ligada a "Sí procede".
- El código retro-compatible con el formato antiguo (`interferencias_empresas_aplica`, `ruegos_aplica`) se mantiene sin tocar.
- No hace falta migración de base de datos.

## Resultado

Tanto en el punto 10 como en el 13, el PDF mostrará siempre las dos casillas (NO PROCEDE / SÍ PROCEDE) con el check visible en la opción elegida, manteniendo el cuadro verde con el contenido cuando proceda.
