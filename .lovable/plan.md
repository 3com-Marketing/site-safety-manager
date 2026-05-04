
## Objetivo

Añadir un nuevo texto legal editable que aparece en el Acta de Reunión CAE justo después de los asistentes/excusados, con el contenido sobre la firma de conformidad y la Ley 31/1995. Hoy ese texto está hardcodeado en el PDF (línea 446 del edge function) y no se puede editar.

## Cambios

### 1. Base de datos (migración)
Añadir columna `texto_cae_conformidad_asistentes` (tipo `text`, nullable) a la tabla `configuracion_empresa`, con valor por defecto el texto solicitado:

> "Los asistentes firman con lo tratado en prueba de conformidad. Se recuerda que la ausencia a esta Reunión de Prevención supone falta de cumplimiento de la Ley 31/1995 de 8 noviembre de Prevención de Riesgos Laborables en su Artículo 24 sobre la Coordinación de actividades empresariales y con el Real Decreto 171/04. Se podrá convocar a los asistentes a reuniones alternas salvo causas justificadas. Se firmarán todas y cada una de las páginas y se entregará una copia digitalizada a cada uno de los asistentes. La no asistencia a la reunión debe implicar la designación a favor de otro asistente para que pueda aprobar el acta, o en caso contrario, quedará aceptada."

Y `UPDATE` para rellenar el registro existente con ese mismo valor.

### 2. Configuración admin (`src/pages/AdminConfiguracion.tsx`)
- Añadir el campo a la interfaz `ConfigEmpresa` y a `EMPTY_CONFIG`.
- En el acordeón "Acta Reunión CAE", añadir un nuevo bloque (entre el punto 2 bloque 2 y el punto 4) con `RichTextEditor`:
  - Label: "Conformidad de asistentes (tras tabla de asistentes)"

### 3. Formulario (`src/components/documentos/formularios/FormActaReunion.tsx`)
- Nuevo estado `textoConformidadAsistentes`.
- Cargarlo desde `configuracion_empresa.texto_cae_conformidad_asistentes` al crear nuevo CAE (añadirlo al array `fieldsToLoad`).
- Cargarlo desde `extra.texto_conformidad_asistentes` al abrir documento existente.
- Guardarlo en `datosExtra.texto_conformidad_asistentes`.
- Añadir un `RichTextEditor` visible solo cuando `isCAE`, ubicado tras el campo de Excusados, con label "Conformidad de asistentes (texto legal)".

### 4. PDF (`supabase/functions/generar-documento-pdf/index.ts`, función `templateActaReunionSimple`)
Reemplazar el párrafo hardcodeado de la línea 446:
```ts
html += `<p style="...">Los firmantes del presente acta...</p>`;
```
por la lógica:
```ts
const textoConformidad = extra.texto_conformidad_asistentes 
  || config?.texto_cae_conformidad_asistentes 
  || "Los firmantes del presente acta, manifiestan su conformidad...";
html += `<div class="section-text" style="font-size:9pt;text-align:justify;margin-top:12pt;">${renderRichText(textoConformidad)}</div>`;
```
Esto mantiene retrocompatibilidad: documentos antiguos sin el campo siguen mostrando un texto sensato; los nuevos usan el configurado.

## Alcance

- Solo afecta al Acta Reunión CAE (es donde se llama `templateActaReunionSimple` con `isInicial=false` e `isSYS=false` en el flujo CAE; el bloque CAE completo usa `templateActaReunion`, no este simple — verificaré en implementación si el texto debe colocarse también en la rama completa). Ajustaré ambas ramas si procede para que el texto aparezca tras la tabla de asistentes en el PDF de CAE.
- No toca actas de Reunión Inicial ni SyS.
- No borra datos.
