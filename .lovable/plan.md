## Problema

En el diálogo de firmas de presencia, el usuario no encuentra un botón claro de **"Firmar"**. Los botones actuales del paso 1 (responsable) y paso 2 (técnico) están etiquetados como **"Siguiente: …"**, lo que da la sensación de que aún no se ha firmado nada y el usuario no sabe cómo confirmar.

Además, en el paso del técnico, si tiene firma guardada, el botón "Siguiente: Resumen" aparece **deshabilitado** hasta que elige una opción, sin un mensaje claro de qué hacer.

## Solución

Renombrar los CTAs para que comuniquen explícitamente la acción de firmar y reforzar visualmente el botón de avance.

### Cambios concretos en `src/components/visita/FirmaPresenciaDialog.tsx`

1. **Paso 1 — Responsable**: cambiar el botón
   - De: `Siguiente: Firma del técnico`
   - A: **`Firmar y continuar`** (con icono `PenLine`, fondo `bg-primary`, texto en negrita).

2. **Paso 2 — Técnico (modo dibujar)**: cambiar el botón
   - De: `Siguiente: Resumen`
   - A: **`Firmar y continuar`** (mismo estilo reforzado).

3. **Paso 2 — Técnico (modo firma guardada elegida)**: el botón mostrará **`Continuar al resumen`** (ya hay firma, no se "firma" de nuevo).

4. **Paso 2 — Técnico (modo `choose`, aún sin elegir)**: en lugar de un botón deshabilitado silencioso, mostrar un texto guía: *"Selecciona una opción de firma para continuar"* y mantener el botón oculto hasta elegir, o como tooltip explicativo.

5. **Paso 3 — Resumen**: el botón final ya dice **`Cerrar visita`**, lo dejamos pero añadimos el icono de firma para coherencia visual.

### Resultado esperado

El técnico verá en cada paso un CTA claro: **"Firmar y continuar"** en los pasos donde dibuja, y **"Cerrar visita"** al final. Ya no habrá ambigüedad sobre dónde se firma.

No hay cambios de base de datos ni de otros componentes.
