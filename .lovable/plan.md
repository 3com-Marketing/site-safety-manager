

# Plan: Paso 4 — Reescribir useDocumentosObra con react-query

## Cambio principal

Reemplazar el hook actual (useState/callbacks manuales) por la versión react-query que el usuario ha proporcionado. Esto cambia la API del hook:

| Antes | Después |
|---|---|
| `useDocumentosObra()` (sin params) | `useDocumentosObra(obraId)` |
| `documentos`, `loading`, `fetchDocumentos(obraId)` | `documentos`, `isLoading` (auto-fetch) |
| `createDocumento(payload)` | `crearDocumento.mutateAsync(payload)` |
| `updateDocumento(id, updates)` | `actualizarEstado.mutateAsync({id, estado})` |
| `deleteDocumento(id)` | `eliminarDocumento.mutateAsync(id)` |
| `uploadArchivo(docId, file)` | `adjuntarArchivo.mutateAsync({id, file})` |
| `fetchAsistentes`, `addAsistente`, etc. | Incluidos en el select join, no se necesitan funciones separadas |

## Archivos a modificar

### 1. `src/hooks/useDocumentosObra.ts`
Reescribir completamente con el código proporcionado. Mantener exports de tipos (`Documento`, `Asistente`, etc.) y `TIPO_LABELS`/`ESTADO_LABELS` para compatibilidad.

### 2. `src/pages/AdminDocumentos.tsx`
- Pasar `obraId` al hook: `useDocumentosObra(obraId)`
- Eliminar `fetchDocumentos` manual y `useEffect` — react-query lo hace automático
- Cambiar `loading` → `isLoading`

### 3. `src/pages/AdminDocumentoDetalle.tsx`
- Necesita el `obra_id` del documento para instanciar el hook → cargar documento primero con query directa, luego usar hook con `obra_id`
- Cambiar `updateDocumento` → `actualizarEstado` o adaptar

### 4. `src/pages/TechDocumentos.tsx`
- Cambiar la lógica: el hook ahora requiere `obraId`, pero el técnico tiene múltiples obras → mantener la query manual existente o crear un hook auxiliar `useDocumentosTecnico`

### 5. `src/components/documentos/NuevoDocumentoDialog.tsx`
- Recibir `obraId` como prop y pasar al hook
- Cambiar `createDocumento` → `crearDocumento.mutateAsync`

### 6. `src/components/documentos/AdjuntarDocumentoDialog.tsx`
- Necesita `obraId` del documento → recibirlo como prop
- Cambiar `uploadArchivo` → `adjuntarArchivo.mutateAsync`

### 7. `src/components/documentos/DocumentosList.tsx`
- Solo usa `TIPO_LABELS` y `Documento` type — cambio mínimo de imports

### 8. `src/components/documentos/DocumentoStatusBadge.tsx`
- Usa `ESTADO_LABELS` — mantener export en hook para compatibilidad

### 9. `src/components/documentos/formularios/FormActaReunion.tsx`
- Usa `fetchAsistentes`, `addAsistente`, etc. — estas funciones ya no existen en el nuevo hook
- Los datos de asistentes/actividades/empresas vienen en el join del query principal
- Adaptar para recibir datos como props y usar mutations inline o un mini-hook

### 10. Formularios restantes (`FormActaNombramiento`, `FormActaAprobacion`, `FormInforme`)
- Solo usan `type Documento` — cambio mínimo

## Decisión de diseño: TechDocumentos

El nuevo hook requiere un `obraId` fijo, pero los técnicos ven documentos de múltiples obras. Opciones:
- **A**: Crear un hook separado `useDocumentosTecnico()` que hace la query multi-obra
- **B**: Mantener query manual en `TechDocumentos.tsx`

Recomiendo **B** (mantener query manual) para no complicar el hook principal.

## Orden de implementación
1. Reescribir `useDocumentosObra.ts` (mantener re-exports de tipos)
2. Actualizar `AdminDocumentos.tsx`
3. Actualizar `AdminDocumentoDetalle.tsx`
4. Actualizar `NuevoDocumentoDialog.tsx` + `AdjuntarDocumentoDialog.tsx`
5. Actualizar `FormActaReunion.tsx` (el más complejo)
6. Dejar `TechDocumentos.tsx` con query manual
7. Ajustes menores en imports de otros archivos

