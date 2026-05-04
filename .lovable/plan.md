## Problema

En el punto **3.2 del Acta Reunión CAE**, los campos "Inicio" y "Fin" usan `<input type="datetime-local">`, que **obliga a introducir fecha + hora**. Si el usuario quiere poner solo la hora (sin fecha), el navegador deja el campo inválido o vacío y en el PDF aparece "—".

El helper `fmtFechaHora` del PDF ya contempla el caso `HH:mm` → "a las HH:mm", pero nunca llega ese formato al backend porque el input no lo permite.

## Solución

Separar cada campo (Inicio y Fin) en **dos inputs independientes**: uno de fecha (`type="date"`) y uno de hora (`type="time"`), ambos opcionales. Combinarlos al guardar siguiendo este criterio:

- fecha + hora → `YYYY-MM-DDTHH:mm` → PDF: `dd/mm/yyyy a las HH:mm`
- solo fecha → `YYYY-MM-DD` → PDF: `dd/mm/yyyy`
- solo hora → `HH:mm` → PDF: `a las HH:mm` ✅ (este es el caso que pide el usuario)
- vacío → "—"

El helper del PDF ya soporta los tres formatos, así que **no hay que tocar la edge function**.

### Cambios

**1. `src/components/documentos/formularios/FormActaReunion.tsx`**

- En el estado `nuevaDuracion`, separar `inicio` y `fin` en cuatro campos visuales: `inicio_fecha`, `inicio_hora`, `fin_fecha`, `fin_hora` (manteniendo `inicio` y `fin` como strings combinados al guardar para no romper la estructura existente).
- Reemplazar los dos `<Input type="datetime-local">` por cuatro inputs:
  - Inicio: `<Input type="date">` + `<Input type="time">` (con icono calendario/reloj visibles que ya trae el navegador).
  - Fin: igual.
- En `handleAddDuracion`, combinar:
  ```ts
  const combinar = (f: string, h: string) =>
    f && h ? `${f}T${h}` : f || h || '';
  ```
- Para entradas existentes (al editar), parsear el string guardado de vuelta en fecha/hora si viene en formato `YYYY-MM-DDTHH:mm`.
- Actualizar el helper local `formatFechaHora` para alinearse con el del PDF (añadir casos solo-fecha y solo-hora), de modo que la lista previa muestre lo mismo que el PDF.

**2. PDF (`supabase/functions/generar-documento-pdf/index.ts`)**

Sin cambios — el helper ya soporta los tres formatos.

## Resultado

El usuario puede dejar la fecha en blanco y poner solo la hora; en el PDF aparecerá, por ejemplo, **"a las 09:30"** en la celda correspondiente. Si rellena ambos, sale **"04/05/2026 a las 09:30"**.
