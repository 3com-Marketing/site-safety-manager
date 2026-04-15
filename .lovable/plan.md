

# Plan: Editor de texto enriquecido (tipo Google Docs) para textos legales

## Resumen

Reemplazar los `<Textarea>` de los textos legales en Configuración (y en los formularios de documentos) por un editor WYSIWYG con formato: negrita, cursiva, listas numeradas/con viñetas, encabezados, etc. El contenido se almacenará como HTML, que se renderizará directamente en los PDFs.

## Enfoque técnico

**Editor**: TipTap (basado en ProseMirror) — es el editor rico más popular para React, ligero y extensible.

**Almacenamiento**: Los campos `texto_*` en `configuracion_empresa` y `datos_extra` pasarán de texto plano a HTML. No requiere cambio de esquema (siguen siendo columnas `text`).

**PDF**: La función `generar-documento-pdf` ya genera HTML. En lugar de hacer `.replace(/\n/g, "<br/>")`, se insertará el HTML del editor directamente (ya formateado).

## Cambios

### 1. Instalar dependencias TipTap
- `@tiptap/react`, `@tiptap/starter-kit` (incluye negrita, cursiva, listas, encabezados, historial)
- `@tiptap/extension-underline` (subrayado)

### 2. Crear componente `RichTextEditor`
- Nuevo archivo: `src/components/ui/rich-text-editor.tsx`
- Barra de herramientas con botones: **B**, *I*, U, H2, H3, lista con viñetas, lista numerada, deshacer/rehacer
- Estilo coherente con el diseño existente (bordes, colores)
- Props: `value` (HTML string), `onChange` (HTML string), `placeholder`

### 3. Actualizar `AdminConfiguracion.tsx`
- Reemplazar los 9 `<Textarea>` de textos legales por `<RichTextEditor>`
- La función `update()` sigue igual — ahora recibe HTML en vez de texto plano

### 4. Actualizar formularios de documentos
- `FormInforme.tsx`: campos recomendaciones y normativa → `RichTextEditor`
- `FormActaReunion.tsx`: campo texto legal → `RichTextEditor`
- `FormActaNombramiento.tsx`: campo texto legal → `RichTextEditor`
- `FormActaAprobacion.tsx`: campo texto legal → `RichTextEditor`

### 5. Actualizar generación PDF
- `generar-documento-pdf/index.ts`: donde se renderiza texto con `.replace(/\n/g, "<br/>")` o `white-space: pre-wrap`, cambiar a insertar el HTML directamente
- Añadir estilos CSS para `ul`, `ol`, `strong`, `em`, `u`, `h2`, `h3` dentro de `.section-text` y `.legal-text`

### 6. Migración de datos existentes
- Los textos planos existentes seguirán funcionando porque el editor TipTap puede cargar texto plano y mostrarlo correctamente. Se envuelven en `<p>` tags al cargar si no contienen HTML.

## Archivos afectados
- **Nuevo**: `src/components/ui/rich-text-editor.tsx`
- **Editado**: `src/pages/AdminConfiguracion.tsx` (9 Textareas → RichTextEditor)
- **Editado**: `src/components/documentos/formularios/FormInforme.tsx`
- **Editado**: `src/components/documentos/formularios/FormActaReunion.tsx`
- **Editado**: `src/components/documentos/formularios/FormActaNombramiento.tsx`
- **Editado**: `src/components/documentos/formularios/FormActaAprobacion.tsx`
- **Editado**: `supabase/functions/generar-documento-pdf/index.ts` (renderizado HTML)
- **Dependencias**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`

