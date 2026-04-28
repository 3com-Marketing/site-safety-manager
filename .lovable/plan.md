# Integrar la firma digital en los documentos

## Problema

En los formularios de documentos (Acta Aprobación, Acta Nombramiento, Acta Reunión, Informe) aparece una sección titulada **"Firma"**, pero solo contiene los campos *Lugar de la firma* y *Fecha del documento*. Esos campos solo controlan el texto "En {lugar}, a {fecha}." que se imprime sobre la línea de firma en el PDF — no hay ninguna firma gráfica.

El usuario espera ver ahí la firma digital (la imagen guardada en su perfil o una dibujada en el momento), igual que ya funciona al cerrar un informe de visita.

## Solución propuesta

### 1. Renombrar el bloque actual para evitar confusión
El bloque actual con *Lugar* + *Fecha* pasa a llamarse **"Lugar y fecha del documento"** (no "Firma"). Sin cambios funcionales.

### 2. Añadir bloque real de "Firma digital" en los 4 formularios
Debajo del bloque anterior, en `FormActaAprobacion`, `FormActaNombramiento`, `FormActaReunion` y `FormInforme`:

- Si el usuario tiene firma guardada en su perfil: mostrar previsualización + botón **"Usar mi firma guardada"** y opción **"Firmar ahora"** (canvas táctil).
- Si no tiene firma guardada: solo opción **"Firmar ahora"** con aviso "Puedes guardar una firma en tu perfil para agilizar este paso."
- Una vez seleccionada/dibujada, mostrar previsualización con botón "Cambiar".
- La firma se guarda asociada al documento (no modifica la del perfil).

### 3. Persistencia
Añadir al objeto `extra` (jsonb) de `documentos` dos campos:
- `firma_url`: URL pública de la firma usada (PNG transparente)
- `firma_at`: timestamp del momento en que se firmó

Reutilizar el bucket `logos` con prefijo `firmas-documentos/{documento_id}_{timestamp}.png`. Crear políticas de storage para ese prefijo si hace falta.

### 4. Renderizado en el PDF
Actualizar `supabase/functions/generar-documento-pdf/index.ts` para:
- Leer `extra.firma_url` del documento.
- Si existe, descargarla y embeberla como imagen sobre la línea de "Firmado por: {nombre}" en cada plantilla (acta de aprobación, nombramiento, reunión, informe).
- Si no existe, mantener el comportamiento actual (línea vacía).

## Componentes a tocar

- **Reutilizar** el componente `ConfirmarFirmaDialog` (o extraer su lógica a un `FirmaSelector` embebible) para usarlo dentro de los formularios sin necesidad de un diálogo modal.
- **Editar**: `FormActaAprobacion.tsx`, `FormActaNombramiento.tsx`, `FormActaReunion.tsx`, `FormInforme.tsx`.
- **Editar**: `supabase/functions/generar-documento-pdf/index.ts` para pintar la firma en el PDF.
- **Migración**: políticas de storage para `firmas-documentos/` en el bucket `logos`.

## Detalles técnicos

- La firma se sube a storage en el momento de **guardar** el documento (no antes), para no acumular archivos huérfanos.
- Se reutiliza `removeWhiteBackground` ya existente en `FirmaCapture` y `ConfirmarFirmaDialog` para garantizar fondo transparente.
- En el PDF se inserta como imagen ~150x60 px alineada a la izquierda sobre la línea de firma, encima del nombre del firmante.
- No se modifica el flujo de cierre de informes de visita (ya funciona).
- No se toca la firma del perfil del usuario en ningún caso.

## Resultado esperado

En cada formulario de documento, debajo de "Lugar y fecha del documento", aparecerá un bloque "Firma digital" funcional donde el usuario podrá usar su firma guardada o dibujar una nueva, y esa firma aparecerá impresa en el PDF generado.
