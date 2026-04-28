# Paso de firma de presencia al cerrar la visita

## Resumen

Antes de marcar una visita como `finalizada`, se intercala un nuevo paso modal con dos firmas obligatorias en orden: **Responsable de la empresa** y **Técnico**. Solo cuando ambas estén confirmadas se ejecuta el cierre real (GPS + update en BD). Las firmas se guardan asociadas a la visita y se imprimen al final del PDF del informe.

No se toca ningún otro paso del flujo, ni `FirmaCapture`, ni `FirmaSelector`, ni `ConfirmarFirmaDialog`. Se crea un componente nuevo dedicado.

---

## 1. Base de datos

Añadir columnas a la tabla `visitas`:

- `firma_responsable_url text` — PNG transparente en storage
- `firma_responsable_nombre text`
- `firma_responsable_cargo text`
- `firma_tecnico_url text` — PNG transparente
- `firmas_at timestamptz` — momento exacto del cierre firmado

Storage: reutilizar bucket `logos` con prefijo `firmas-visitas/{visita_id}_{rol}_{timestamp}.png` (políticas ya cubren a usuarios autenticados con el patrón existente; si hace falta, se añade política específica para ese prefijo).

Las RLS ya permiten al técnico dueño actualizar su visita (`Users can update own visitas`), así que no se añaden nuevas políticas en `visitas`.

## 2. Nuevo componente `FirmaPresenciaDialog`

Ruta: `src/components/visita/FirmaPresenciaDialog.tsx`.

Diálogo modal a pantalla completa en tablet con tres estados internos (`step`):

1. **`responsable`**
   - Texto legal completo destacado (no en letra pequeña, ~13–14pt, con borde sutil).
   - Inputs obligatorios: *Nombre y apellidos* y *Cargo* del responsable.
   - Canvas táctil (reutiliza la lógica de trazado ya escrita en `FirmaCapture` / `FirmaSelector` mediante una pequeña utilidad compartida nueva `signatureCanvas.ts`, **sin modificar** los componentes existentes).
   - Botones: «Borrar» y «Confirmar firma» (deshabilitado hasta que haya nombre + cargo + trazo).
   - Al confirmar → genera PNG con fondo transparente y pasa al paso 2.

2. **`tecnico`**
   - Muestra el nombre del técnico autenticado (no editable, leído de `tecnicos`/`profiles`).
   - Si tiene `firma_url` en su perfil: dos opciones lado a lado: *«Usar mi firma guardada»* (preview) y *«Firmar ahora»* (canvas).
   - Si no tiene: solo canvas + aviso «Puedes guardar una firma en tu perfil para agilizar este paso».
   - Botones: «Borrar» y «Confirmar firma».
   - Al confirmar → pasa al paso 3.

3. **`resumen`**
   - Muestra ambas firmas en miniatura, nombre + cargo del responsable, nombre del técnico, y fecha + hora actuales (timestamp del momento exacto del cierre).
   - Botón principal: **«Cerrar visita»** que dispara el callback `onConfirm({ responsableNombre, responsableCargo, responsableBlob, tecnicoBlob | tecnicoUrl, firmasAt })`.
   - Botón secundario «Volver» que regresa al paso anterior por si quieren rehacer una firma.

El diálogo no se puede cerrar con la X mientras el paso esté en curso (excepto botón explícito «Cancelar» que vuelve al estado previo de la visita sin guardar nada).

## 3. Integración en `VisitaActiva.tsx`

Cambios mínimos en `src/pages/VisitaActiva.tsx`:

- Añadir estado `showFirmaPresencia: boolean`.
- En `finishVisita()`: en lugar de pedir GPS directamente, abrir el diálogo `FirmaPresenciaDialog`.
- Cuando el diálogo emite `onConfirm(firmasPayload)`:
  1. Subir blobs al bucket `logos/firmas-visitas/...` y obtener URLs públicas.
  2. Continuar el flujo GPS existente (`finishVisita` original) con un parámetro extra `firmasPayload`.
  3. En `persistFinish()` (única función modificada en lógica), incluir en el `update` de `visitas` los nuevos campos: `firma_responsable_url`, `firma_responsable_nombre`, `firma_responsable_cargo`, `firma_tecnico_url`, `firmas_at`.

No se altera ningún otro paso ni componente.

## 4. PDF del informe (`supabase/functions/generar-pdf/index.ts`)

Añadir, justo antes del `</body>`, una sección **«Firmas de presencia»**:

- Carga `visitas` ya viene en la query existente; ampliar el `select` para traer los nuevos campos (`firma_responsable_url`, `firma_responsable_nombre`, `firma_responsable_cargo`, `firma_tecnico_url`, `firmas_at`) y el nombre del técnico.
- Si la visita está cerrada y existen firmas → bloque con:
  - Texto legal completo (mismo wording, ~10–11pt, con borde).
  - Recuadro «Responsable de la empresa»: imagen `firma_responsable_url`, nombre, cargo, fecha y hora (`firmas_at`).
  - Recuadro «Técnico»: imagen `firma_tecnico_url`, nombre, fecha y hora.
- Si no existen firmas (PDF generado antes del cierre): mismo bloque pero los recuadros muestran **«Pendiente de firma»** en gris. La generación nunca falla por falta de firmas.

## Archivos a crear / editar

**Crear**
- `src/components/visita/FirmaPresenciaDialog.tsx`
- `src/components/visita/signatureCanvas.ts` (helpers compartidos: `removeWhiteBackground`, `drawOnCanvas`)
- Migración SQL con las 5 columnas nuevas en `visitas`.

**Editar**
- `src/pages/VisitaActiva.tsx` (intercalar el diálogo antes de `persistFinish` y añadir campos al `update`).
- `supabase/functions/generar-pdf/index.ts` (sección «Firmas de presencia» al final + ampliar `select`).

## Garantías

- Imposible avanzar al paso 2 sin nombre + cargo + firma trazada del responsable.
- Imposible cerrar la visita sin la firma del técnico confirmada.
- La firma guardada del perfil **no se modifica nunca** desde este flujo (solo se reutiliza copiándola).
- El timestamp `firmas_at` se fija al pulsar «Cerrar visita» en el resumen, no antes.
- El PDF sigue generándose aunque no haya firmas (estado «Pendiente de firma»).