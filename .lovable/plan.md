

# Plan: Paso 8 — Ajuste menor a AdjuntarDocumentoDialog

El componente ya existe y funciona correctamente. Solo necesita un cambio menor:

## Cambio

**`src/components/documentos/AdjuntarDocumentoDialog.tsx`** — Actualizar el atributo `accept` del input de archivo:
- **Antes**: `.pdf,.jpg,.jpeg,.png,.webp`
- **Después**: `.pdf,.docx,.jpg,.jpeg,.png,.webp` (añadir `.docx`)
- Actualizar el texto descriptivo para mencionar "PDF, Word o imagen"

Todo lo demás (preview del nombre, subida al bucket `documentos-obra`, actualización de estado a `adjuntado` via `adjuntarArchivo`) ya está implementado.

