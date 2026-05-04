Objetivo
Eliminar el campo “Excusados / Ausentes” de la vista del documento para las actas de reunión inicial, también al abrir el documento desde el icono del ojo.

Qué voy a hacer
1. Corregir la condición en `src/components/documentos/formularios/FormActaReunion.tsx`.
   - Ahora mismo el formulario calcula bien `tipoActual`, pero el render del bloque de excusados está comprobando `tipo`.
   - En documentos ya creados, ese prop puede no venir y por eso el campo sigue apareciendo en la ficha/detalle.
   - Lo cambiaré para que use `tipoActual !== 'acta_reunion_inicial'`.

2. Verificar consistencia con la previsualización/PDF.
   - He revisado la plantilla de `supabase/functions/generar-documento-pdf/index.ts` y la rama simple de `acta_reunion_inicial` ya no pinta el bloque de excusados.
   - No hace falta tocar base de datos ni configuración para este ajuste.

3. Comprobar el resultado funcionalmente.
   - Nuevo documento: no debe aparecer el campo.
   - Documento ya creado abierto desde el “ojo”: tampoco debe aparecer.
   - Acta reunión CAE y acta reunión SyS: el campo debe seguir visible.

Detalles técnicos
- Archivo a cambiar: `src/components/documentos/formularios/FormActaReunion.tsx`
- Cambio exacto previsto:
```tsx
{tipoActual !== 'acta_reunion_inicial' && (
  <div className="space-y-2">
    <Label>Excusados / Ausentes</Label>
    <Textarea value={excusados} onChange={e => setExcusados(e.target.value)} rows={2} />
  </div>
)}
```

Impacto
- Solo afecta a la UI del formulario/detalle.
- No borra datos existentes.
- No cambia otros tipos de acta.

En cuanto lo apruebes, lo aplico.