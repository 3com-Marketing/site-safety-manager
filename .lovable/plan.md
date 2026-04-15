
# Plan: Paso 3 — Tipos TypeScript para documentos

## Situación actual

Ya existen tipos básicos en `src/hooks/useDocumentosObra.ts` (`TipoDocumento`, `EstadoDocumento`, `TIPO_LABELS`, `ESTADO_LABELS`) derivados de los tipos auto-generados de Supabase. El usuario quiere añadir tipos más ricos: labels mejorados, rol por tipo, colores por estado, e interfaces detalladas para cada formulario.

## Cambios

### 1. Crear `src/types/documentos.ts`
Archivo nuevo con todo lo que el usuario ha especificado:
- `TipoDocumento` y `EstadoDocumento` como union types explícitos
- `TIPO_DOCUMENTO_LABELS` con labels mejorados (ej. "Acta Nombramiento (Obra con Proyecto)")
- `TIPO_DOCUMENTO_ROL` — qué rol puede crear cada tipo
- `ESTADO_DOCUMENTO_COLORS` — clases CSS por estado (los colores cambian: pendiente pasa a rojo)
- Interfaces: `DatosActaNombramiento`, `DatosActaAprobacionDGPO`, `DatosActaAprobacionPlanSYS`, `DatosActaReunionCAE`, `DatosActaReunionInicial`, `DatosInforme`

### 2. Actualizar imports en archivos existentes
Migrar los componentes para usar los nuevos tipos centralizados:

| Archivo | Cambio |
|---|---|
| `useDocumentosObra.ts` | Importar `TIPO_DOCUMENTO_LABELS` como `TIPO_LABELS`, mantener re-export para compatibilidad |
| `DocumentoStatusBadge.tsx` | Usar `ESTADO_DOCUMENTO_COLORS` del nuevo archivo en vez de colores locales |
| `NuevoDocumentoDialog.tsx` | Importar `TIPO_DOCUMENTO_LABELS` y `TIPO_DOCUMENTO_ROL` para filtrar tipos según rol del usuario |
| `TechDocumentos.tsx` | Filtrar tipos visibles usando `TIPO_DOCUMENTO_ROL` |

### 3. Filtrado por rol en NuevoDocumentoDialog
Usar `TIPO_DOCUMENTO_ROL` + `useAuth().role` para mostrar solo los tipos de documento que corresponden al rol actual (admin ve los de admin + ambos, técnico ve los de técnico + ambos).

## Archivos afectados
- **Nuevo**: `src/types/documentos.ts`
- **Editados**: `useDocumentosObra.ts`, `DocumentoStatusBadge.tsx`, `NuevoDocumentoDialog.tsx`, `TechDocumentos.tsx`
