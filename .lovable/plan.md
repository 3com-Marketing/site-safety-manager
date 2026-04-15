

# Plan: Paso 5 — Reescribir DocumentosList como componente autónomo

## Cambio principal

Reemplazar el `DocumentosList` actual (tabla pasiva que recibe `documentos` como prop) por un componente autónomo que usa `useDocumentosObra(obraId)` internamente y gestiona sus propios diálogos de crear/adjuntar/firmar.

## Archivos a modificar

### 1. `src/components/documentos/DocumentosList.tsx` — Reescritura completa
- Recibe `obraId` y `readOnly` como props (en vez de `documentos[]`)
- Usa `useDocumentosObra(obraId)` internamente
- Renderiza cards por documento con: tipo, fecha, coordinador, badge de estado con colores de `ESTADO_DOCUMENTO_COLORS`
- Botones por documento: "Adjuntar" (abre dialog), "Firmar" (actualiza estado a firmado), enlace al archivo si existe
- Botón "Nuevo documento" en header (solo si `!readOnly`)
- Gestiona internamente `NuevoDocumentoDialog` y `AdjuntarDocumentoDialog`
- Estado vacío con icono y mensaje

### 2. `src/components/documentos/AdjuntarDocumentoDialog.tsx` — Ajuste de props
- Cambiar prop `documento: Documento | null` → `documentoId: string` (el componente padre ya no necesita pasar el objeto completo, solo el id)
- Buscar el documento del hook o simplemente usar el id directamente en `adjuntarArchivo`

### 3. `src/pages/AdminDocumentos.tsx` — Simplificar
- Ya no pasa `documentos` ni `onAttach` ni gestiona dialogs de adjuntar
- Solo pasa `obraId` a `DocumentosList`
- Mantiene selector de obra y botón "Nuevo documento" a nivel de página, o delega todo al componente

### 4. `src/pages/TechDocumentos.tsx` — Simplificar
- Problema: el técnico ve documentos de múltiples obras → no puede usar un solo `obraId`
- Solución: mantener la query manual multi-obra, pero adaptar a la nueva interfaz del componente
- Opción: renderizar un `DocumentosList` por cada `obraId` del técnico, o mantener una lista plana con el componente actual usando `readOnly`

## Decisión: TechDocumentos

Como el técnico puede tener múltiples obras, renderizaré un `DocumentosList` por obra (agrupado con el nombre de la obra como header). Esto permite que cada instancia use su propio hook y gestione adjuntar/firmar independientemente.

## Orden
1. Reescribir `DocumentosList.tsx` con el código del usuario (card-based, autónomo)
2. Ajustar `AdjuntarDocumentoDialog` para aceptar `documentoId` string
3. Simplificar `AdminDocumentos.tsx`
4. Adaptar `TechDocumentos.tsx` para renderizar un `DocumentosList` por obra

