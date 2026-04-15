

# Plan: Generación de PDF de documentos con logotipos

## Resumen

Crear una edge function `generar-documento-pdf` que genera HTML con logotipos (SafeWork + cliente) para cada tipo de documento, y añadir un botón "Generar PDF" en la vista de detalle. También necesitamos que clientes puedan tener un logo subido.

## Cambios necesarios

### 1. Migración BD — Añadir `logo_url` a `clientes`

```sql
ALTER TABLE public.clientes ADD COLUMN logo_url text DEFAULT '';
```

Esto permite almacenar la URL del logotipo de cada cliente (subido al bucket existente o a uno nuevo `logos`).

### 2. AdminClientes.tsx — Campo para subir logo del cliente

En el diálogo de crear/editar cliente, añadir un input de archivo para subir el logo al bucket de storage. Se guarda la URL pública en `logo_url`.

### 3. Logo SafeWork — Subir al proyecto

Añadir el logotipo de SafeWork como archivo estático en `public/logo-safework.png` (o SVG). Se referenciará en los PDFs con la URL pública del proyecto.

### 4. Nueva edge function `generar-documento-pdf`

Recibe `{ documento_id }` y:
- Consulta `documentos_obra` con sus relaciones (obra → cliente con `logo_url`)
- Según el `tipo`, genera el HTML correspondiente con:
  - **Cabecera**: logo SafeWork (izquierda) + logo cliente (derecha) si existe
  - **Cuerpo**: datos del formulario mapeados desde `datos_extra` y campos directos del documento
  - **Pie**: lugar y fecha de firma, espacios para firmas
- Devuelve `{ html, filename }` para que el frontend haga `window.print()` o use iframe

Plantillas por tipo:
- **Acta Nombramiento**: datos proyecto, promotor, coordinador, cláusulas legales
- **Acta Aprobación DGPO/Plan SYS**: agentes del proyecto, párrafo de aprobación
- **Acta Reunión CAE**: asistentes (tabla), actividades, empresas acceso, riesgos
- **Acta Reunión Inicial/SYS**: asistentes, notas
- **Informe CSS/AT**: secciones de inspección con campos de texto

### 5. AdminDocumentoDetalle.tsx — Botón "Generar PDF"

Añadir botón junto a "Adjuntar firmado" que:
- Llama a `supabase.functions.invoke('generar-documento-pdf', { body: { documento_id } })`
- Abre una ventana con el HTML recibido y dispara `window.print()`
- Actualiza el estado del documento a `generado` si estaba en `pendiente`

### 6. Storage bucket para logos (opcional)

Crear bucket `logos` público, o reutilizar `documentos-obra` para almacenar los logos de clientes.

## Archivos afectados
- **Migración**: añadir `logo_url` a `clientes`, crear bucket `logos`
- **Nuevo**: `supabase/functions/generar-documento-pdf/index.ts`
- **Nuevo**: `public/logo-safework.png` (el usuario deberá proporcionar el archivo)
- **Editado**: `src/pages/AdminClientes.tsx` (campo upload logo)
- **Editado**: `src/pages/AdminDocumentoDetalle.tsx` (botón generar PDF)
- **Editado**: `src/pages/AdminDocumentos.tsx` (botón generar PDF en tabla)

