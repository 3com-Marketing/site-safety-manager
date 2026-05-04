## Problema

En el PDF del Acta Reunión CAE, punto **3.2 Duración y ubicación de los trabajos**, cuando se introduce una fecha+hora en los campos Inicio / Fin, en el documento generado **no aparece la hora con el texto "a las"** como espera el usuario.

Causa: el formateador actual produce `dd/MM/yyyy HH:mm` pero el usuario quiere el literal **"a las HH:mm"** acompañando a la fecha. Además, si el campo solo contiene fecha o solo hora (parcial), el regex actual no lo captura y el contenido se imprime crudo o vacío.

## Cambio

**Archivo único:** `supabase/functions/generar-documento-pdf/index.ts` (líneas 571–575)

Sustituir el helper `fmtFechaHora` por uno que cubra los tres casos posibles:

- `YYYY-MM-DDTHH:mm` → `dd/MM/yyyy a las HH:mm`
- `YYYY-MM-DD` → `dd/MM/yyyy`
- `HH:mm` → `a las HH:mm`
- vacío → `—`
- otro → se imprime tal cual

```typescript
const fmtFechaHora = (v: string | undefined): string => {
  if (!v) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (m) return `${m[3]}/${m[2]}/${m[1]} a las ${m[4]}:${m[5]}`;
  const md = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (md) return `${md[3]}/${md[2]}/${md[1]}`;
  const mh = /^(\d{2}):(\d{2})$/.exec(v);
  if (mh) return `a las ${mh[1]}:${mh[2]}`;
  return v;
};
```

Con esto, una entrada como `2026-05-04T09:30` se renderizará en el PDF como **"04/05/2026 a las 09:30"**.

## No se cambia

- El formulario (`FormActaReunion.tsx`) ya usa `<input type="datetime-local">` y guarda en formato ISO; no necesita cambios.
- En la previsualización dentro de la app también se aplicará el mismo formato actualizando el helper `formatFechaHora` del formulario para que use **"a las"** y sea consistente con el PDF.

**Segundo retoque** en `src/components/documentos/formularios/FormActaReunion.tsx` (helper `formatFechaHora` en la cabecera del archivo): cambiar `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` por `${m[3]}/${m[2]}/${m[1]} a las ${m[4]}:${m[5]}` para mantener coherencia visual entre vista previa y PDF.
