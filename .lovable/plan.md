

# Plan: Paso 10 — Reescritura completa de AdminDocumentos.tsx

Reemplazar la vista actual (simple selector de obra + DocumentosList) por una tabla completa con filtros, estadísticas y acciones inline.

## Cambio

### `src/pages/AdminDocumentos.tsx` — Reescritura completa

**Query directa**: En lugar de usar `useDocumentosObra` (que requiere un `obraId`), hacer una query directa a `documentos_obra` con join a `obras` para obtener el nombre de la obra:

```sql
SELECT *, obras(nombre) FROM documentos_obra ORDER BY created_at DESC
```

**4 stat cards en cabecera**: Total, Pendientes (rojo), Generados (amarillo), Firmados (verde) — calculados del array filtrado.

**Filtros** (fila debajo de las stats):
- Por obra: Select simple con todas las obras
- Por tipo: Select con checkboxes (multi-select simulado con state array)
- Por estado: Select con checkboxes (multi-select simulado)
- Por rango de fechas: Dos date pickers (desde/hasta)

**Tabla** con columnas:
- Obra (nombre de la obra)
- Tipo (label legible desde `TIPO_DOCUMENTO_LABELS`)
- Estado (`DocumentoStatusBadge`)
- Fecha documento
- Coordinador
- Archivo (icono Download/link si `archivo_url` existe)
- Acciones: Ver detalle (navega a `/admin/documento/:id`), Marcar firmado (mutation inline), Eliminar (con confirmación)

**Mutations**: Para "Marcar firmado" y "Eliminar", como no usamos `useDocumentosObra` (necesita obraId fijo), hacer mutations directas con `supabase.from('documentos_obra').update/delete` + invalidar la query.

## Archivos afectados
- **Reescrito**: `src/pages/AdminDocumentos.tsx`
- La ruta `/admin/documentos` y el enlace en `AdminLayout.tsx` ya existen — no requieren cambios.

