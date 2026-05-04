## Objetivo

En el PDF del Acta Reunión CAE, "Plataforma CAE utilizada: …" aparece dos veces. Hay que eliminar la segunda aparición (la que sale debajo de la línea "No procede / Otros").

## Cambio a realizar

**Archivo:** `supabase/functions/generar-documento-pdf/index.ts` (líneas 523–526)

Eliminar el bloque:

```typescript
// Plataforma CAE
if (extra.plataforma_cae) {
  html += `<p style="font-size:9pt;margin-top:6pt;"><strong>Plataforma CAE utilizada:</strong> ${extra.plataforma_cae}</p>`;
}
```

La otra aparición de "Plataforma CAE utilizada" (que ya sale dentro del texto del Punto 2 / bloque 2) se mantiene intacta.

## Notas

- No hay cambios en el formulario, base de datos ni configuración.
- Sin impacto en el resto de plantillas de PDF.
