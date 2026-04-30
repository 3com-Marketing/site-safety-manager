# Texto legal de presencia visible antes de las dos firmas

## Contexto

El plan previo ya añade un paso modal `FirmaPresenciaDialog` con dos firmas en orden (responsable + técnico) antes de cerrar la visita. Faltaba dejar explícito **dónde y cómo** se muestra el texto legal para que sea claramente visible y legible para ambos firmantes.

Este plan acota únicamente esa parte. El resto del flujo de cierre, los componentes existentes y el resto del diálogo no se tocan respecto al plan ya aprobado.

## Dónde aparece el texto legal

El texto legal completo se muestra **dos veces, siempre antes de firmar**:

1. **Paso 1 — Responsable de la empresa**: el texto aparece en la parte superior del paso, antes de los campos de nombre/cargo y del canvas. El responsable lo lee antes de firmar.
2. **Paso 2 — Técnico**: se vuelve a mostrar el mismo texto en la parte superior, antes de la opción de firma guardada / canvas. El técnico también lo confirma con su firma.

En el **paso 3 — Resumen** se muestra una versión compacta del texto (misma redacción, sin recortes) acompañando las dos firmas, para que quede claro qué se está confirmando al pulsar «Cerrar visita».

## Cómo se presenta visualmente

Para garantizar legibilidad en tablet (audiencia principal) y en escritorio:

- Bloque destacado dentro de un recuadro propio (borde sutil + fondo `bg-muted/30`).
- Tamaño de fuente **base 14px** (no «letra pequeña»), interlineado holgado (`leading-relaxed`).
- Encabezado breve **«Antes de firmar, lea este texto:»** sobre el bloque, en `font-semibold`.
- Ancho máximo legible (`max-w-prose`) y padding generoso (`p-4`).
- Scroll interno solo si el viewport es muy bajo; nunca colapsado/oculto detrás de un acordeón.
- Texto seleccionable (no `select-none`) para que pueda copiarse si se quiere.

El texto exacto es el que ya proporcionaste en el mensaje original («Las firmas que figuran a continuación acreditan únicamente la presencia del técnico…»). Se guarda como constante en el componente para reutilizarlo en los tres lugares (paso 1, paso 2, resumen) y también en el PDF.

## Cambios concretos respecto al plan ya aprobado

Solo afectan al archivo nuevo `src/components/visita/FirmaPresenciaDialog.tsx`:

- Constante `TEXTO_LEGAL_PRESENCIA` en la cabecera del archivo.
- Subcomponente local `<TextoLegalPresencia />` que renderiza el bloque destacado descrito arriba.
- Se invoca en los tres pasos del wizard (`responsable`, `tecnico`, `resumen`).

En el PDF (`supabase/functions/generar-pdf/index.ts`) se reutiliza la misma cadena (duplicada como constante en el edge function, ya que no hay módulos compartidos cliente/servidor) con tamaño 10–11pt y borde, tal como ya estaba previsto.

## Garantías

- El texto legal **siempre** es visible antes de cada firma; no se puede firmar sin tenerlo en pantalla.
- No queda oculto en tooltips, acordeones ni modales secundarios.
- Misma redacción literal en cliente y en PDF.
- Ningún componente existente (`FirmaCapture`, `FirmaSelector`, `ConfirmarFirmaDialog`, formularios de documentos) se modifica.
