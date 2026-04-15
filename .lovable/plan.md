

# Plan: Estructura de archivos — Documentos de obra

## Resumen

Crear toda la estructura de archivos para el módulo de documentos de obra: 3 páginas, 5 componentes, 4 formularios, 1 hook, y registrar las rutas en `App.tsx` y la navegación admin.

## Archivos a crear

### 1. Hook: `src/hooks/useDocumentosObra.ts`
- Encapsula CRUD contra `documentos_obra` + tablas relacionadas (`asistentes_reunion`, `actividades_reunion_cae`, `empresas_acceso_obra`)
- Funciones: `fetchDocumentos(obraId)`, `createDocumento`, `updateDocumento`, `deleteDocumento`, `uploadArchivo`, `fetchAsistentes`, `addAsistente`, etc.
- Usa `supabase` client y `useAuth` para `creado_por`

### 2. Componentes compartidos: `src/components/documentos/`

| Archivo | Función |
|---|---|
| `DocumentosList.tsx` | Tabla/lista de documentos con columnas: tipo, título, estado, fecha. Filtro por tipo. Click abre detalle. |
| `DocumentoStatusBadge.tsx` | Badge coloreado por estado: pendiente (gris), generado (azul), adjuntado (amarillo), firmado (verde) |
| `NuevoDocumentoDialog.tsx` | Dialog `max-w-2xl`: selector de tipo de documento + formulario dinámico según tipo seleccionado. Usa los formularios de `formularios/` |
| `AdjuntarDocumentoDialog.tsx` | Dialog para subir archivo firmado (PDF/imagen) al bucket `documentos-obra`. Actualiza `archivo_url`, `archivo_nombre`, `estado = 'adjuntado'` |

### 3. Formularios: `src/components/documentos/formularios/`

| Archivo | Tipos de documento que cubre |
|---|---|
| `FormActaNombramiento.tsx` | `acta_nombramiento_cae`, `acta_nombramiento_proyecto` — campos coordinador, empresa, promotor |
| `FormActaAprobacion.tsx` | `acta_aprobacion_dgpo`, `acta_aprobacion_plan_sys` — campos coordinador, promotor, datos_extra |
| `FormActaReunion.tsx` | `acta_reunion_cae`, `acta_reunion_inicial`, `acta_reunion_sys` — campos comunes + CRUD asistentes + actividades (CAE) + empresas acceso (CAE) |
| `FormInforme.tsx` | `informe_css`, `informe_at` — campos coordinador + datos_extra específicos |

Cada formulario recibe `documento` (para edición) o `obraId` + `tipo` (para creación) y un callback `onSave`.

### 4. Páginas

| Archivo | Ruta | Descripción |
|---|---|---|
| `AdminDocumentos.tsx` | `/admin/documentos` | Selector de obra + `DocumentosList` + botón "Nuevo documento". Usa `AdminLayout`. |
| `AdminDocumentoDetalle.tsx` | `/admin/documento/:id` | Carga documento por id, renderiza formulario correcto según `tipo`, permite editar/guardar/adjuntar archivo. |
| `TechDocumentos.tsx` | `/documentos` | Lista documentos de las obras asignadas al técnico. Solo lectura + puede adjuntar archivos firmados. |

### 5. Rutas y navegación

- `App.tsx`: añadir 3 rutas nuevas (`/admin/documentos`, `/admin/documento/:id`, `/documentos`)
- `AdminLayout.tsx`: añadir tab "Documentos" con icono `FileStack` en la barra de navegación

## Patrón de implementación

Seguir el mismo patrón que `AdminClientes.tsx` / `AdminObras.tsx`:
- Estado local con `useState` (no react-hook-form, consistente con el resto)
- `supabase` client directo para queries
- `toast` de sonner para feedback
- Dialogs con `max-w-2xl`
- Tablas con componentes `Table` de shadcn

## Orden de implementación

1. `useDocumentosObra.ts` (hook base)
2. `DocumentoStatusBadge.tsx` (componente simple)
3. `DocumentosList.tsx` (lista con badge)
4. Formularios (4 archivos)
5. `NuevoDocumentoDialog.tsx` + `AdjuntarDocumentoDialog.tsx`
6. `AdminDocumentos.tsx` + `AdminDocumentoDetalle.tsx`
7. `TechDocumentos.tsx`
8. Rutas en `App.tsx` + tab en `AdminLayout.tsx`

