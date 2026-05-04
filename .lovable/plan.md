## Diagnóstico

El texto guardado en configuración (`texto_acta_reunion_inicial`) contiene listas HTML donde **el propio texto del `<li>` ya empieza por su marcador manual** ("1.", "2.", "a)", "b)"…), porque así fue escrito en el editor:

```html
<ol><li><p>1. Establecimiento de medidas…</p></li></ol>
<ol start="2"><li><p>2. Planificación…</p></li></ol>
<ol><li><p>a) Aviso previo…</p></li><li><p>b) Plan y Planes…</p></li>…</ol>
```

Cuando el PDF renderiza esto, el navegador añade además **su propia numeración** del `<ol>`, produciendo el resultado visible en las capturas:

- "1. **1.** Establecimiento…"
- "2. **2.** Planificación…"
- "1. **a)** Aviso previo…", "2. **b)** Plan y Planes…", … "16. **o)** Respetar…"

El PDF "no inventa" nada nuevo, simplemente está añadiendo la numeración nativa de `<ol>` por encima de la que el usuario ya escribió a mano.

## Solución

Respetar literalmente lo que hay en configuración significa **suprimir la numeración nativa de las listas** dentro de los textos legales/sección de los actas, y dejar que el contenido escrito por el usuario sea el que se vea. Es un cambio de **CSS dentro del PDF**, no se toca ni el editor ni los textos guardados.

### Cambios en `supabase/functions/generar-documento-pdf/index.ts`

En la función `baseStyles()` (que es la que se aplica al Acta de Reunión Inicial vía `templateActaReunionSimple` → bloque `texto_legal`), añadir reglas para los contenedores de texto rico:

```css
.section-text ol, .section-text ul,
.legal-text   ol, .legal-text   ul {
  list-style: none;
  margin: 4pt 0;
  padding-left: 0;
}
.section-text li, .legal-text li {
  margin: 2pt 0;
  padding-left: 0;
}
```

Y, además, envolver el `texto_legal` del Acta de Reunión Inicial (línea ~775 de `templateActaReunionSimple`) en `class="legal-text"` para que aplique la regla:

```ts
html += `<div class="legal-text" style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
```

Con esto:
- Las listas ya no muestran el "1." / "2." / "1." / "2." automático del navegador.
- Aparece exactamente lo que el usuario escribió en configuración: "1. Establecimiento…", "2. Planificación…", "a) Aviso previo…", … "o) Respetar…".
- No se modifica ningún texto en BD ni el editor; lo que escribió el admin se respeta tal cual.

### Por qué NO modificar los textos guardados o el editor

- El usuario quiere ver lo que escribió, sin que se reformatee.
- Si se quitase el "1." manual y se confiase en la numeración nativa del `<ol>`, se rompería el formato mixto del documento (los "a)…o)" no son numeración estándar, ni el "h)" repetido del punto 8/9 se podría reproducir con un `<ol>`).
- Suprimir el marcador automático es la única forma de garantizar fidelidad 1:1 con lo redactado.

### Alcance

- **Sólo** se cambia el CSS del PDF y se añade la clase `legal-text` al bloque del texto legal del Acta de Reunión Inicial.
- No se tocan: textos en `configuracion_empresa`, formularios, otros tipos de acta (DGPO, Plan SyS, Nombramiento, CAE, Reunión SyS) — sus reglas CSS ya viven en `baseStyles()`/`informeStyles()` y heredarán el mismo arreglo, lo cual es deseado: si en el futuro alguien escribe "1." dentro de un `<ol>` en cualquier otro acta, también se respetará.

## Verificación

1. Abrir un Acta de Reunión Inicial existente y generar el PDF.
2. Comprobar que el texto legal aparece tal cual en configuración:
   - "1. Establecimiento de medidas…" (sin "1. 1.")
   - "2. Planificación…" (sin "2. 2.")
   - "a) Aviso previo…", "b) Plan y Planes…", … "o) Respetar…" (sin "1. a)", "2. b)"…)
3. Generar un Acta de Aprobación DGPO y un Acta de Nombramiento para confirmar que siguen en una sola página y no se han alterado.
