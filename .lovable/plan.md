## Cambios en el Acta de Reunión Inicial

### 1. Nuevo campo editable en Configuración

Añadimos un campo nuevo `texto_intro_reunion_inicial` para el párrafo introductorio que aparece antes de los asistentes. Así el admin puede editarlo igual que el resto de textos legales.

- **Tabla `configuracion_empresa`**: añadir columna `texto_intro_reunion_inicial TEXT NOT NULL DEFAULT ''` (migración).
- **Texto por defecto** (se inserta como contenido inicial del campo, con placeholders entre llaves para que el admin sepa qué se sustituye automáticamente):

  > "{localidad}, a {fecha}, en el lugar fijado en la convocatoria, se celebra la reunión de coordinación en Materia de Seguridad y Salud Laboral con la asistencia de las siguientes empresas, cada una representada por las personas indicadas, y en concepto del cargo señalado:"

- **UI** (`src/pages/AdminConfiguracion.tsx`, sección "Acta Reunión Inicial", ~línea 299): añadir un segundo `RichTextEditor` con label **"Párrafo introductorio (antes de asistentes)"** y un texto de ayuda explicando los placeholders disponibles: `{localidad}`, `{fecha}`.

### 2. Renderizado en el PDF

En `supabase/functions/generar-documento-pdf/index.ts`, función `templateActaReunionSimple`:

- Antes del `<h2>ASISTENTES</h2>`, **sólo si `isInicial === true`**, leer `config.texto_intro_reunion_inicial`, sustituir los placeholders `{localidad}` → `extra.localidad` (o `_______________` si vacío) y `{fecha}` → `fechaStr`, y renderizar como párrafo justificado.
- Si el campo está vacío, no se imprime nada (no se rompe nada en actas existentes).

Hay que asegurar que el edge function carga ese campo al consultar `configuracion_empresa`. Verificar el `select(...)` de configuración y añadir `texto_intro_reunion_inicial` si usa lista explícita de columnas (probablemente usa `*`, en cuyo caso ya viene incluido).

### 3. Eliminar la sección "Excusados / Ausentes"

Confirmado: en los documentos de referencia que enviaron no aparece esta sección y **no es obligatoria legalmente** (Ley 31/1995 y RD 1627/1997 sólo exigen recoger asistentes y acuerdos).

- Eliminar el bloque `if (extra.excusados) { ... }` en `templateActaReunionSimple` (líneas 771-774).
- El campo `excusados` puede seguir en BD por compatibilidad, simplemente ya no se imprime.
- También ayuda a mantener la compactación a una sola página.

### Archivos afectados

- **Migración**: añadir columna `texto_intro_reunion_inicial` a `configuracion_empresa`.
- `src/pages/AdminConfiguracion.tsx` — interfaz `ConfiguracionEmpresa`, estado inicial y bloque "Acta Reunión Inicial" con el nuevo editor.
- `supabase/functions/generar-documento-pdf/index.ts` — `templateActaReunionSimple`: insertar párrafo intro con sustitución de placeholders y eliminar bloque excusados.

### Detalles técnicos

```ts
// En templateActaReunionSimple, antes del <h2>ASISTENTES</h2>
if (isInicial && config?.texto_intro_reunion_inicial) {
  const loc = extra.localidad || "_______________";
  const intro = config.texto_intro_reunion_inicial
    .replaceAll("{localidad}", loc)
    .replaceAll("{fecha}", fechaStr);
  html += `<div style="font-size:10pt;line-height:1.6;text-align:justify;margin-top:16pt;margin-bottom:8pt;">
    ${renderRichText(intro)}
  </div>`;
}
```

### Verificación

1. **Configuración**: aparece nuevo editor "Párrafo introductorio" en la sección "Acta Reunión Inicial". Se puede editar y guardar.
2. **PDF Acta Reunión Inicial**: aparece el párrafo "Maspalomas, a 24 de marzo de 2026, …" justo antes de la tabla de asistentes, con localidad y fecha sustituidas.
3. **PDF Acta Reunión SyS**: NO aparece el nuevo párrafo (sólo es para la inicial).
4. Ya no aparece la sección "EXCUSADOS / AUSENTES".
5. Editar el texto en configuración y regenerar el PDF → se refleja el cambio.
