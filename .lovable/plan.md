## Objetivo

En el **Punto 3 del Acta Reunión CAE** (PDF), cambiar la sección "Riesgos previstos":

1. Cambiar el título por: **"Riesgos previstos para los trabajos especificados en el alcance"**.
2. Eliminar la lista con viñetas (`<ul>`) que solo mostraba los riesgos marcados.
3. Mostrar **siempre** los 6 campos en una rejilla tipo checklist (3 columnas), con casilla marcada ☒ si está seleccionado o ☐ si no, replicando el formato del documento de referencia subido.

Campos fijos a mostrar siempre:
- Atrapamiento
- Arrollamiento
- Caída de altura
- Espacios confinados
- Riesgo eléctrico
- Otros: (con el texto introducido en `otros_riesgos` si existe)

## Cambio técnico

**Archivo:** `supabase/functions/generar-documento-pdf/index.ts` (líneas 533–540)

Reemplazar el bloque actual:

```typescript
if (extra.riesgos?.length > 0) {
  html += `<p style="font-size:9pt;font-weight:bold;margin-top:8pt;">Riesgos previstos:</p>`;
  html += `<ul style="font-size:9pt;">`;
  for (const r of extra.riesgos) html += `<li>${r}</li>`;
  if (extra.otros_riesgos) html += `<li>Otros: ${extra.otros_riesgos}</li>`;
  html += `</ul>`;
}
```

Por un bloque que:
- Siempre renderiza el título nuevo.
- Construye una tabla de 3 columnas con las 6 opciones fijas.
- Cada celda muestra `☒` o `☐` según `extra.riesgos.includes(...)`.
- En la celda "Otros" añade el texto de `extra.otros_riesgos` si existe.

```text
[☒] Atrapamiento      [☒] Arrollamiento     [☒] Caída de altura
[☐] Espacios confinados [☒] Riesgo eléctrico [☐] Otros: ______
```

## Notas

- No se cambia el formulario (`FormActaReunion.tsx`): los checkboxes y campo "Otros" siguen igual.
- No hay cambios en base de datos.
- Solo afecta a la plantilla del PDF del Acta Reunión CAE.
